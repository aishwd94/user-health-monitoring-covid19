from flask import Flask, escape, request
from flask_cors import  cross_origin
from flask import current_app, flash, jsonify, make_response, redirect, request, url_for
import time
from math import sin, cos, sqrt, atan2, radians
from networkx.readwrite import json_graph
import networkx as nx

from functools import reduce
import pandas as pd
import functions

app = Flask(__name__)


allowed_keys = ['device_key' , 'lat', 'long', 'duration', 'state', 'zipcode', 'observation_count' ]

@app.route('/get_data', methods=['POST'])
@cross_origin()
def get_data():
    global df,filtered_df
    #pdb.set_trace()
    try:
        print(request.json)
        selections = request.json.get('filters','')
        
        
        def appendQuotes(key,value,df):
            
            if df.dtypes[key] == 'O':
                value = f'"{str(value)}"'
            return value
            
        filters = '(' + ') & ('.join([ ' | '.join([k + '==' + appendQuotes(k,i,df) for i in v]) for k,v in selections.items() if k in allowed_keys and k != '']) + ')'
        filters = filters.strip()
        
        expr = ''
        #pdb.set_trace()
        
        if selections.get("index"):
            expr = 'index < ' + selectionsget("index") + ' & '
        
        if filters != '()':
            expr += filters
            
        #pdb.set_trace()
        if '&' not in expr:
            expr = expr.strip('()')
        filtered_df = df
        print(expr)
        if expr.strip():
            filtered_df = df.query(expr)
        
        filtered_df = filtered_df.iloc[:int(selections.get("max_items",[200])[0])]
        
        #pdb.set_trace()
        
        filtered_df['t0'] = filtered_df.groupby('device_key')['unix_time'].transform(lambda x: x.iat[0])
        filtered_df['lat0'] = filtered_df.groupby('device_key')['lat'].transform(lambda x: x.iat[0])
        filtered_df['lon0'] = filtered_df.groupby('device_key')['long'].transform(lambda x: x.iat[0])
        
        filtered_df['dist_m'] = filtered_df.apply(
            lambda row: getDistanceFromLatLonInKm(
                lat1=row['lat'],
                lon1=row['long'],
                lat2=row['lat0'],
                lon2=row['lon0']
            ),
            axis=1
        )
        
        # create a new column for velocity
        filtered_df['velocity_mps'] = filtered_df.apply(
            lambda row: calc_velocity(
                dist_m=row['dist_m'],
                time_start=row['t0'],
                time_end=row['unix_time']
            ),
            axis=1
        )
        
       
        filtered_df['coordinates'] = filtered_df[['long','lat']].values.tolist()
        
        #filtered_df.drop(columns=['long','lat'],inplace=True)
        
        fdf = filtered_df.groupby('device_key').apply(lambda x : x.to_dict(orient='list')).to_list()
        
        #pdb.set_trace()
        response = {'data': fdf } #recur_dictify(fdf.reset_index())
        
        
    except Exception as e:
        response = {'error':'Exception while fetching data:'+str(e)}
    
    return response
    

def recur_dictify(frame):
    
    if len(frame.columns) == 1:
        if frame.values.size == 1: return frame.values[0][0]
        return frame.values.squeeze()
    grouped = frame.groupby(frame.columns[0])
    d = {k: recur_dictify(g.iloc[:,1:]) for k,g in grouped}
    return d

@app.route('/get_form_fields', methods=['GET'])
@cross_origin()
def get_form_fields():
    global df,filtered_df
    print(request.args)
    #pdb.set_trace()
    col = request.args.get("column")
    key = request.args.get("key")
    if not col or not key:
        return {'error':'Specify column as column name form which to search and key as search value. Can be only done on str columns'}
    
    if ((df[col].dtype != 'object')):
        return {'error': 'This endpoint can only return searches on str dataypes'}
    
    
    retlist = df[df[col].str.contains(key,case=False)][col].unique()[:int(request.args.get("max_items",10))].tolist()
    response={col:retlist}
    print(response)
    return response


"""
@app.route('/get_graph_metrics', methods=['GET'])
@cross_origin()
def get_graph_metrics():
    global G
    damping_factor=0.85
    personalization={}
    json_g = json_graph.node_link_data(G)
    pagerank = nx.pagerank(G, alpha=damping_factor,personalization=personalization)
    harmonic_centrality = nx.harmonic_centrality(G,distance='weight')
    
    pdb.set_trace()
    response = {}
    if json_g['nodes']:


        response['overlap'] = 'success'
    else:
        response['overlap'] = 'error'
    
    return response

"""


@app.route('/get_graph', methods=['GET'])
@cross_origin()
def get_graph_data():
    global df, filtered_df, G
    #pdb.set_trace()
    print(filtered_df.head(1000).describe())
    print("Start time: " + str(time.time()))
    cdf, centroids = functions.get_clusters(filtered_df.head(1000))
    graphdf = functions.get_places(cdf,overlap_threshold=900)
    nodes = cdf['device_key'].unique()          
    G = functions.get_graph(graphdf)
    json_g = json_graph.node_link_data(G)
    pagerank = nx.pagerank(G, alpha=0.85,personalization={})
    harmonic_centrality = nx.harmonic_centrality(G,distance='weight')
    response = {}
    #pdb.set_trace()
    if json_g['nodes']:
        response['graph'] = json_g
        for k in json_g['nodes']:
            id = k['id']
            k['pagerank'] = pagerank[id]
            k['harmonic_centrality'] = harmonic_centrality[id]
        
        response['overlap'] = 'success'

    else:
        response['overlap'] = "No data returned. There is no overlap between the nodes."
    print("End time:" + str(time.time()))
    print(response)
    return response



def getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2):
    R = 6371 # Radius of the earth in m
    dLat = radians(lat2-lat1)
    dLon = radians(lon2-lon1)
    rLat1 = radians(lat1)
    rLat2 = radians(lat2)
    a = sin(dLat/2) * sin(dLat/2) + cos(rLat1) * cos(rLat2) * sin(dLon/2) * sin(dLon/2) 
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    d = R * c # Distance in meters
    return d

def calc_velocity(dist_m, time_start, time_end):
    """Return 0 if time_start == time_end, avoid dividing by 0"""
    return dist_m / (time_end - time_start) if time_end > time_start else 0



import pdb

if __name__ == "__main__":
    lst_str_cols = ['device_key','zipcode']
    df = pd.read_parquet('../../data/tmp.parquet', engine='pyarrow')
    #filtered_df = functions.get_sample_data(10)
    #df = pd.concat([filtered_df, df]).reset_index(drop = True) 
    df = df.rename(columns={ 'device_key':'device_key',
                        'latitude':'lat',
                        'longitude':'long',
                        'min_duration_seconds':'duration',
                        'state_abbr':'state',
                        'zipcode_5':'zipcode'
                        })
                        
    filtered_df =  df.head(500) #functions.get_sample_data(10)
    #df = pd.concat([filtered_df, df]).reset_index(drop = True) 
    df['device_key'] = df['device_key'].apply(str)
    df['zipcode'] = df['zipcode'].apply(str)
    df.drop(columns=['datetime', 'datetime_str_time','datetime_end_time'],inplace=True)
    df['datetime'] = pd.to_datetime(df['unix_time'])
    df = df.set_index('datetime')
    #pdb.set_trace()

    #df.reset_index(inplace=True)
    app.run(host='0.0.0.0')
