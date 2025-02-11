import pandas as pd
import numpy as np
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from scipy.fft import fft, ifft, fftfreq
import os
import tempfile
import json
import re

app = Flask(__name__)
CORS(app)

# Constants
SAMPLE_RATE = 1000  # Hz

# Keep the weighting functions as they were
def wb_weight(frequency):
    """ISO 2631-1 Wk weighting for vertical vibrations."""
    if frequency < 0.4:
        return 0
    elif 0.4 <= frequency <= 2:
        return 0.4 * frequency
    elif 2 < frequency <= 100:
        return 1
    else:
        return 0

def wd_weight(frequency):
    """ISO 2631-1 Wd weighting for horizontal vibrations."""
    if frequency < 0.4:
        return 0
    elif 0.4 <= frequency <= 2:
        return 0.4 * frequency
    elif 2 < frequency <= 100:
        return 1
    else:
        return 0

def weighted_acceleration(data, sample_rate, weight_func):
    n = len(data)
    freq = fftfreq(n, d=1/sample_rate)
    fft_values = fft(data)
    weighted_fft = fft_values * np.array([weight_func(abs(f)) for f in freq])
    weighted_time_domain = np.abs(ifft(weighted_fft))
    return weighted_time_domain

def safe_parse_array(value):
    """Safely parse array data with enhanced type handling."""
    if pd.isna(value):
        return []
    
    # Handle numpy arrays and lists
    if isinstance(value, (list, np.ndarray)):
        return [float(x) for x in value]
    
    # Handle single numeric values
    if isinstance(value, (int, float)):
        return [float(value)]
    
    # Handle string representations
    if isinstance(value, str):
        try:
            # Try parsing as JSON
            parsed = json.loads(value)
            if isinstance(parsed, (list, np.ndarray)):
                return [float(x) for x in parsed]
            return [float(parsed)]
        except:
            try:
                # Try parsing as comma-separated values
                cleaned = value.strip('[]')
                return [float(x.strip()) for x in cleaned.split(',') if x.strip()]
            except:
                print(f"Failed to parse value: {value}")
                return []
    
    print(f"Unhandled type {type(value)} for value: {value}")
    return []

def calculate_nmv(row):
    try:
        # Convert acceleration data to m/s^2
        g = 9.81
        X_mps2 = np.array(row["X"]) * g
        Y_mps2 = np.array(row["Y"]) * g
        Z_mps2 = np.array(row["Z"]) * g
        
        # Apply weighting
        x_weighted = weighted_acceleration(X_mps2, SAMPLE_RATE, wd_weight)
        y_weighted = weighted_acceleration(Y_mps2, SAMPLE_RATE, wd_weight)
        z_weighted = weighted_acceleration(Z_mps2, SAMPLE_RATE, wb_weight)
        
        # Calculate 95th percentile
        x_p95 = np.percentile(x_weighted, 95)
        y_p95 = np.percentile(y_weighted, 95)
        z_p95 = np.percentile(z_weighted, 95)
        
        # NMV formula with adjustable scaling factor
        scaling_factor = 0.01
        nmv = scaling_factor * np.sqrt(x_p95**2 + y_p95**2 + z_p95**2)
        return float(nmv)  # Ensure we return a float
    except Exception as e:
        print(f"Error calculating NMV: {e}")
        return None

@app.route('/calculate-rci', methods=['POST'])
def process_csv():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        print(f"Processing file: {file.filename}")
        
        # Read the CSV with more flexible parsing
        df = pd.read_csv(file, skip_blank_lines=True)
        print(f"Columns in DataFrame: {df.columns.tolist()}")
        
        # Convert numeric columns to float
        for col in ['speed', 'pdop', 'batt', 'Vbatt']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Filter out rows with pdop > 1000
        if 'pdop' in df.columns:
            df = df[df['pdop'] <= 1000]
            if len(df) == 0:
                return jsonify({"error": "All rows filtered out due to pdop > 1000"}), 400
        
        # Process acceleration columns
        for col in ['X', 'Y', 'Z']:
            if col not in df.columns:
                return jsonify({"error": f"Missing required column: {col}"}), 400
            df[col] = df[col].apply(safe_parse_array)
            if df[col].apply(len).sum() == 0:
                return jsonify({"error": f"No valid data found in column {col}"}), 400
        
        # Calculate RCI
        df["Ride_Comfort_Index"] = df.apply(calculate_nmv, axis=1)
        
        # Clean up the results
        df = df.dropna(subset=['Ride_Comfort_Index'])
        if len(df) == 0:
            return jsonify({"error": "No valid results after processing"}), 400
        
        # Ensure speed and Ride_Comfort_Index are proper floats
        df['speed'] = pd.to_numeric(df['speed'], errors='coerce')
        df['Ride_Comfort_Index'] = df['Ride_Comfort_Index'].astype(float)
        
        # Save processed data
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, 'processed_data.csv')
        
        # Convert to CSV with specific handling for numeric columns
        df.to_csv(output_path, index=False, float_format='%.6f')
        
        return send_file(output_path, as_attachment=True, download_name='processed_data.csv')
    
    except Exception as e:
        print(f"Unhandled error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/map-data', methods=['GET'])
def get_map_data():
    try:
        # Get the path to the processed CSV file
        temp_dir = tempfile.gettempdir()
        processed_csv_path = os.path.join(temp_dir, 'processed_data.csv')
        
        if not os.path.exists(processed_csv_path):
            return jsonify({"error": "Processed data not found. Please upload and process a CSV file first."}), 404
        
        # Read the CSV file
        df = pd.read_csv(processed_csv_path)
        
        # Check if the required columns exist
        if 'coordinate' not in df.columns or 'Ride_Comfort_Index' not in df.columns or 'pdop' not in df.columns:
            return jsonify({"error": "Required columns missing in processed data."}), 400
        
        # Filter out rows with pdop > 1000
        df = df[df['pdop'] <= 1000]
        if len(df) == 0:
            return jsonify({"error": "All rows filtered out due to pdop > 1000"}), 400
        
        try:
            # Handle potential NaN or invalid values
            df['coordinate'] = df['coordinate'].fillna('')
            
            # Split coordinates and convert to float
            df[['latitude', 'longitude']] = df['coordinate'].str.split(',', expand=True)
            df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
            df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
            
            # Ensure Ride_Comfort_Index is numeric
            df['Ride_Comfort_Index'] = pd.to_numeric(df['Ride_Comfort_Index'], errors='coerce')
            
            # Drop rows with invalid data
            df = df.dropna(subset=['latitude', 'longitude', 'Ride_Comfort_Index'])
            
            if len(df) == 0:
                return jsonify({"error": "No valid data points found"}), 400
            
            # Create the response data
            map_data = []
            for _, row in df.iterrows():
                map_data.append({
                    "Ride_Comfort_Index": float(row["Ride_Comfort_Index"]),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"])
                })
            
            return jsonify(map_data)
            
        except Exception as e:
            print(f"Error processing coordinates: {e}")
            return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
        
    except Exception as e:
        print(f"Unhandled error in /api/map-data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000)