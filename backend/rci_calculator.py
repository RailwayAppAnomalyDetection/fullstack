import datetime
import glob
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
    """
    Apply frequency weighting to acceleration data using FFT.
    - `data`: Input acceleration data
    - `sample_rate`: Sampling rate in Hz
    - `weight_func`: Weighting function (e.g., wb_weight or wd_weight)
    Returns: weighted acceleration in the time domain
    """
    n = len(data)
    freq = fftfreq(n, d=1/sample_rate)
    fft_values = fft(data)
    weighted_fft = fft_values * np.array([weight_func(abs(f)) for f in freq])
    weighted_time_domain = np.abs(ifft(weighted_fft))
    return weighted_time_domain

def safe_parse_array(value):
    """Safely parse array-like data from various formats. (list, numpy array, string)
    Handle NaNs, JSON strings, and comma-separated values.
    Returns: list of floats or an empty list if parsing fails"""
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
    """ 
    Calculate the Normalized Motion Value (NMV) for a row of acceleration data
    Applies weighting, computes 95th percentile, and scales the result
    Returns: NMV value as a float or None if an error occurs
    """
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
    """
    Process uploaded CSV file to calculate Ride Comfort Index (RCI).
    - Expects a SCV file with columns: 'X', 'Y', 'Z', 'speed', 'pdop', 'batt', 'Vbatt', etc.
    - Filters out rows with invalid or high PDOP values (>1000).
    - Calculates Rci for valud rows and returns processed data as a CSV file
    """
    try:
        temp_dir = tempfile.gettempdir()
        old_files = glob.glob(os.path.join(temp_dir, 'processed_data_*.csv'))
        for file in old_files:
            try:
                os.remove(file)
                print(f"Deleted old file: {file}")
            except Exception as e:
                print(f"Error deleting {file}: {e}")

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
        # Generate unique filename for each processed files
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'processed_data_{timestamp}.csv'
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, filename)
        
        # Convert to CSV with specific handling for numeric columns
        df.to_csv(output_path, index=False, float_format='%.6f')
        
        return send_file(output_path, as_attachment=True, download_name=filename)
    
    except Exception as e:
        print(f"Unhandled error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/map-data', methods=['GET'])
def get_map_data():
    try:
        temp_dir = tempfile.gettempdir()
        processed_files = glob.glob(os.path.join(temp_dir, 'processed_data_*.csv'))
        
        print(f'Found {len(processed_files)} processed files')

        if not processed_files:
            return jsonify({"error": "Processed data not found."}), 404
        
        latest_file = max(processed_files, key=os.path.getctime)
        print(f"Reading from latest file: {latest_file}")
        
        df = pd.read_csv(latest_file)
        print(f"Number of rows in CSV: {len(df)}")
        
        all_data = []
        for file_path in processed_files:
            try:
                df = pd.read_csv(file_path)
                print(f"Processing file: {file_path}: {len(df)} rows")

                if 'coordinate' not in df.columns or 'Ride_Comfort_Index' not in df.columns:
                    print(f"Missing columns in {file_path}")
                    continue
                
                # Handle coordinate splitting and conversion
                df['coordinate'] = df['coordinate'].fillna('')
                df[['latitude', 'longitude']] = df['coordinate'].str.split(',', expand=True)
                df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
                df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
                df['Ride_Comfort_Index'] = pd.to_numeric(df['Ride_Comfort_Index'], errors='coerce')
                
                # Filter valid data
                df = df.dropna(subset=['latitude', 'longitude', 'Ride_Comfort_Index'])
                if len(df) > 0:
                    new_data = df.apply(
                        lambda row: {
                            "Ride_Comfort_Index": float(row["Ride_Comfort_Index"]),
                            "latitude": float(row["latitude"]),
                            "longitude": float(row["longitude"])
                        },
                        axis=1
                    ).tolist()
                    all_data.extend(new_data)
                    print(f"Added {len(new_data)} points from {file_path}")
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
                continue

        print(f"Total data points collected: {len(all_data)}")
        return jsonify(all_data)

    except Exception as e:
        print(f"Unhandled error in /api/map-data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
@app.route('/api/clear-data', methods=['POST'])
def clear_data():
    try:
        temp_dir = tempfile.gettempdir()
        processed_files = glob.glob(os.path.join(temp_dir, 'processed_data_*.csv'))

        for file_path in processed_files:
            os.remove(file_path)

        return jsonify({"message": "All processed data files have been deleted."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)