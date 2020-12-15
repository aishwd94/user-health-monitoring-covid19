import pandas as pd, numpy as np, matplotlib.pyplot as plt
from sklearn.cluster import DBSCAN
from geopy.distance import great_circle
from shapely.geometry import MultiPoint
from numpy import random
import networkx as nx
from networkx.readwrite import json_graph
import pdb

def get_sample_data(n=20):
    df = pd.DataFrame( columns=['unix_time','device_key','lat','long','duration','observation_count','str_time','end_time','zipcode','state','cluster_type2'])
    t = 1545955200
    for i in range(n): 
        key=random.randint(100,999)
        for j in range(random.randint(2,6)):
            t += random.randint(0,3)
            d = random.randint(0,2000)
            df = df.append({
                        'unix_time': t,
                        'device_key':str(key),
                        'lat':random.uniform(40.970298,41.508481)  ,
                        'long':random.uniform(-89.513079,-88.494756),
                        'duration': d,
                        'str_time': t,
                        'end_time': t + d,
                        'zipcode':'60415',
                        'observation_count':random.randint(0,20),
                        'cluster_type2':'v',
                        'state':'IL'},
                        ignore_index=True)
    keys = df['device_key'].tolist()
    for index, row in df.iterrows():
        if(random.uniform()>0.5):
            t = row['unix_time']
            for _ in range(random.randint(2,6)):
                t += random.randint(0,3)
                d = random.randint(0,2000)
                df = df.append({
                    'unix_time': t + random.randint(0,20),
                    'device_key':random.choice(keys),
                    'lat': row['lat']   + random.random()*0.0000000001  ,
                    'long': row['long'] + random.random()*0.0000000001,
                    'duration' : d,
                    'str_time': t,
                    'end_time': t + d,
                    'zipcode':'60415',
                    'observation_count':random.randint(0,20),
                    'cluster_type2':'v',
                    'state':'IL'},
                    ignore_index=True) 
    return df

def get_centermost_point(cluster):
    centermost_point = None
    if len(cluster) != 0:
        centroid = (MultiPoint(cluster).centroid.x, MultiPoint(cluster).centroid.y)
        centermost_point = min(cluster, key=lambda point: great_circle(point, centroid).m)
    return tuple(centermost_point)
    

def get_clusters(df):
    coords = df.as_matrix(columns=['lat', 'long'])
    kms_per_radian = 6371.0088
    contact_radius = 0.001
    min_samples = 3
    epsilon = contact_radius / kms_per_radian
    db = DBSCAN(eps=epsilon, min_samples=min_samples, algorithm='ball_tree', metric='haversine').fit(np.radians(coords))
    cluster_labels = db.labels_
    num_clusters = len(set(cluster_labels))
    clusters = pd.Series([coords[cluster_labels == n] for n in range(num_clusters)])
    clusters = clusters[clusters.str.len() != 0]
    #pdb.set_trace()
    centermost_points = clusters.map(get_centermost_point)
    centermost_points.dropna()
    df['place_id'] = cluster_labels
    return df, centermost_points
    
    
def get_places(df,overlap_threshold=15):
    graphdf = pd.DataFrame(columns=['node1','node2','overlap','place_id',])

    # Conditional Self join is not possible in pandas 
    for index1,row1 in df.iterrows():
        for index2,row2 in df[(df.place_id == row1.place_id) & (df.index > index1) & (df.device_key != row1.device_key) ].iterrows():
            overlap = min(row1.end_time,row2.end_time) - max(row1.str_time,row2.str_time)
            if(overlap > overlap_threshold):
                graphdf=graphdf.append({'node1':row1.device_key,'node2':row2.device_key,'overlap':overlap,'place_id':row2.place_id},ignore_index=True)
    graphdf = graphdf.drop_duplicates(subset=['node1','node2','place_id'],keep='last')
    return graphdf
   
def get_graph(graphdf):
    G = nx.Graph()
    weights = graphdf.groupby(['place_id']).place_id.count().to_dict()
    for idx,row in graphdf.iterrows():
        G.add_edge(row.node1,row.node2,weight=weights[row.place_id])
    #metricsdf = pd.DataFrame({'pagerank':pagerank , 'harmonic_centrality':harmonic_centrality}).sort_values(by=['pagerank'])
    #pdb.set_trace()
        
    return G
