import pandas as pd
import numpy as np
from flask import Flask, request, send_file
from flask_cors import CORS
from scipy.fft import fft, ifft, fftfreq
import os
import tempfile

app = Flask(__name__)
CORS(app)

def calculate_rci(df):
    # Apply NMV calculation to the dataset
    df["Ride_Comfort_Index"] = df.apply(calculate_nmv, axis=1)

    # Output
    print(df[["timestamp", "Ride_Comfort_Index"]])
    return df
# Constants
SAMPLE_RATE = 1000  # Hz

# Weighting Functions
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

# Frequency Domain Transformation
def weighted_acceleration(data, sample_rate, weight_func):
    n = len(data)
    freq = fftfreq(n, d=1/sample_rate)
    fft_values = fft(data)
    weighted_fft = fft_values * np.array([weight_func(abs(f)) for f in freq])
    weighted_time_domain = np.abs(ifft(weighted_fft))
    return weighted_time_domain

# Calculate NMV
def calculate_nmv(row):
    # Convert acceleration data to m/s^2 (if needed)
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
    scaling_factor = 0.01  # Adjust this value as needed
    nmv = scaling_factor * np.sqrt(x_p95**2 + y_p95**2 + z_p95**2)
    return nmv

@app.route('/calculate-rci', methods=['POST'])
def process_csv():
    if 'file' not in request.files:
        return 'No file uploaded', 400
    
    file = request.files['file']
    if file.filename == '':
        return 'No file selected', 400

    # Read the CSV
    df = pd.read_csv(file)

    for col in ['X', 'Y', 'Z']:
        df[col] = df[col].apply(lambda x: eval(x)) # eval function is used here to convert the string to a list. Be sure to sanitize your input if it comes from external sources to avoid potential security risks
    # Gravitational acceleration constant
    g = 9.81

    # Normalizing X, Y, Z by multiplying each element with g
    df["X"] = df["X"].apply(lambda lst: [x * g for x in lst])
    df["Y"] = df["Y"].apply(lambda lst: [y * g for y in lst])
    df["Z"] = df["Z"].apply(lambda lst: [z * g for z in lst])

    # Calculate RCI
    df_with_rci = calculate_rci(df)
    
    # Create temporary file to save results
    temp_dir = tempfile.gettempdir()
    output_path = os.path.join(temp_dir, 'processed_data.csv')
    df_with_rci.to_csv(output_path, index=False)
    
    return send_file(output_path, as_attachment=True)

if __name__ == '__main__':
    app.run(port=5000)