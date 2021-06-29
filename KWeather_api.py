import numpy as np
import math
from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)
wind = np.load('wind_npy.npy')
heat = np.load('heat_npy.npy')
@app.route('/heat', methods=['GET'])
def hello_world():
    global heat
    gridX = int(request.args.get('gridX'))
    gridY = int(request.args.get('gridY'))
    latGap = float(request.args.get('latGap'))
    lngGap = float(request.args.get('lngGap'))
    maxlat = float(request.args.get('maxlat'))
    maxlng = float(request.args.get('maxlng'))
    minlat = float(request.args.get('minlat'))
    minlng = float(request.args.get('minlng'))

    print(heat.shape)

    tmp = []
    print(minlat)
    current_lat = maxlat
    for i in range(gridY + 1):
        tmp2 = []
        current_lng = minlng
        for j in range(gridX + 1):
            tmp2.append(get_value_from_heat(current_lat, current_lng))
            current_lng += lngGap
        current_lat -= latGap
        tmp.append(tmp2)

    return jsonify(tmp)

@app.route('/wind', methods=['GET'])
def hello_world2():
    global wind
    gridX = int(request.args.get('gridX'))
    gridY = int(request.args.get('gridY'))
    latGap = float(request.args.get('latGap'))
    lngGap = float(request.args.get('lngGap'))
    maxlat = float(request.args.get('maxlat'))
    maxlng = float(request.args.get('maxlng'))
    minlat = float(request.args.get('minlat'))
    minlng = float(request.args.get('minlng'))


    tmp = []
    print(minlat)
    current_lat = maxlat
    for i in range(gridY + 1):
        tmp2 = []
        current_lng = minlng
        for j in range(gridX + 1):
            tmp2.append(get_vector_from_wind(current_lat, current_lng))
            current_lng += lngGap
        current_lat -= latGap
        tmp.append(tmp2)

    return jsonify(tmp)
@app.route('/total', methods=['GET'])
def hello_world3():
    global wind, heat
    gridX = int(request.args.get('gridX'))
    gridY = int(request.args.get('gridY'))
    # latGap = float(request.args.get('latGap'))
    # lngGap = float(request.args.get('lngGap'))
    maxlat = float(request.args.get('maxlat'))
    maxlng = float(request.args.get('maxlng'))
    minlat = float(request.args.get('minlat'))
    minlng = float(request.args.get('minlng'))
    latGap = (maxlat - minlat) / gridY
    lngGap = (maxlng - minlng) / gridX

    tmp = []
    print(minlat)
    current_lat = maxlat
    for i in range(gridY + 1):
        tmp2 = []
        current_lng = minlng
        for j in range(gridX + 1):
            obj = {}
            obj['latlng'] = {"lat" : current_lat, "lng" : current_lng}
            obj['pm10'] = get_value_from_heat(current_lat, current_lng)
            obj['pm25'] = 2
            wind_obj = get_vector_from_wind(current_lat, current_lng)
            obj['wx'] = wind_obj[0]
            obj['wy'] = wind_obj[1]
            obj['t'] = 3
            obj['h'] = 4
            current_lng += lngGap
            tmp2.append(obj)
        current_lat -= latGap
        tmp.append(tmp2)

    return jsonify(tmp)

def get_vector_from_wind(latitude, longitude):
    if latitude <= 30 or latitude >= 44: return [0, 0, 0]
    if longitude <= 118 or longitude >= 134: return [0, 0, 0]

    gridn = select_grid_from_wind(latitude, longitude);
    g00 = wind[gridn[0]][gridn[1]]
    g10 = wind[gridn[0]][gridn[1] + 1]
    g01 = wind[gridn[0] + 1][gridn[1]]
    g11 = wind[gridn[0] + 1][gridn[1] + 1]

    return interploation_from_wind(latitude, longitude, g00, g10, g01, g11)

def select_grid_from_wind(latitude, longitude):
    minlng = 118;
    maxlat = 44;
    gap = 0.5;

    gridlng = math.floor(((longitude * 10 - minlng * 10) / (gap * 10)))
    gridlat = math.floor(((maxlat * 10 - latitude * 10) / (gap * 10)))
    return [gridlat, gridlng]

def interploation_from_wind(latitude, longitude, g00, g10, g01, g11):
    x = (longitude % 0.5) * (1 / 0.5)

    d1 = x
    d2 = 1 - x

    x1_vector_x = 0
    x1_vector_y = 0
    x2_vector_x = 0
    x2_vector_y = 0
    try:
        x1_vector_x = d1 * g10[0] + d2 * g00[0]
        x1_vector_y = d1 * g10[1] + d2 * g00[1]
        x2_vector_x = d1 * g11[0] + d2 * g01[0]
        x2_vector_y = d1 * g11[1] + d2 * g01[1]
    except:
        print('except')
        pass

    y = (latitude % 0.5) * (1 / 0.5)
    d4 = y
    d3 = 1 - y

    result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
    result_vector_y = d3 * x2_vector_y + d4 * x1_vector_y
    result_vector_scale = math.sqrt(result_vector_x * result_vector_x + result_vector_y * result_vector_y)

    result_vector = [result_vector_x, result_vector_y, result_vector_scale]
    return result_vector

def get_value_from_heat (latitude, longitude):
    if latitude <= 30 or latitude >= 44: return 0
    if longitude <= 118 or longitude >= 134: return 0

    gridn = select_grid_from_heat(latitude, longitude);
    g00 = heat[gridn[0]][gridn[1]]
    g10 = heat[gridn[0]][gridn[1] + 1]
    g01 = heat[gridn[0] + 1][gridn[1]]
    g11 = heat[gridn[0] + 1][gridn[1] + 1]

    return interploation_from_heat(latitude, longitude, g00, g10, g01, g11)


def select_grid_from_heat(latitude, longitude):
    minlng = 118;
    maxlat = 44;
    gap = 0.1;

    gridlng = math.floor(((longitude * 10 - minlng * 10) / (gap * 10)))
    gridlat = math.floor(((maxlat * 10 - latitude * 10) / (gap * 10)))
    return [gridlat, gridlng]

def interploation_from_heat (latitude, longitude, g00, g10, g01, g11):
    x = (longitude % 0.1) * (1 / 0.1)

    d1 = x
    d2 = 1 - x

    x1_vector_x = 0
    x2_vector_x = 0
    try:
        x1_vector_x = d1 * float(g10[2]) + d2 * float(g00[2])
        x2_vector_x = d1 * float(g11[2]) + d2 * float(g01[2])
    except:
        pass


    y = (latitude % 0.1) * (1 / 0.1)
    d4 = y
    d3 = 1 - y
    result_vector_x = d3 * x2_vector_x + d4 * x1_vector_x
    return result_vector_x


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port = 4500)


