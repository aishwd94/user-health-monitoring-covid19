import dash
import dash_deck
import pydeck as pdk
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd
import numpy as np
import sys
import random


from dash.dependencies import Input, Output
import plotly.express as px
from plotly import graph_objs as go
from plotly.graph_objs import *
from datetime import datetime as dt

from pyspark.sql import SparkSession


# MapBox API Key
try:
    mapbox_access_token = open('/home/aishw/shared_folder/API_KEYS/mapbox.txt').read().strip()
except IOError as e:
    print('Could not read mapbox api key from file ' + sys.argv[1] + ' exiting...')
    sys.exit()

spark = SparkSession.builder.appName("Location Data App").getOrCreate()
    
def read_data():
    filepath = "/home/aishw/shared_folder/data/tmp.parquet"
    df = spark.read.parquet(filepath)
    
    # Layout of Dash App
    
    TRIPS_LAYER_DATA = "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json"  # noqa
    
    #sdf = pd.read_json(TRIPS_LAYER_DATA)
    #
    #sdf["coordinates"] = sdf["waypoints"].apply(lambda f: [item["coordinates"] for item in f])
    #sdf["timestamps"] = sdf["waypoints"].apply(
    #    lambda f: [item["timestamp"] - 1554772579000 for item in f]
    #)
    #
    #sdf.drop(["waypoints"], axis=1, inplace=True)
    #sdf['color'] = [[233,150,122]]
    return df,sdf

df,sdf = read_data()

df.createOrReplaceTempView("location_table")
device_list = spark.sql('select distinct(device_key) from location_table limit 10').toPandas().values.flatten().tolist()
#pdf = spark.sql('select * from location_table LIMIT 100').toPandas()

COLOR_BREWER_BLUE_SCALE = [
    [240, 249, 232],
    [204, 235, 197],
    [168, 221, 181],
    [123, 204, 196],
    [67, 162, 202],
    [8, 104, 172],
]


def get_map_object(layer,df):
    if layer=='TripsLayer':
        return get_trips_layer(df)
    if layer=='HeatmapLayer':
        return get_heatmap_layer(df)
    

def populate_options_table():
    options_table = {}
    options_table['device_key'] = df.select('device_key').distinct().limit(100).toPandas().to_dict()['device_key'].values()
    options_table['zipcode'] = df.select('zipcode_5').distinct().limit(100).toPandas().to_dict()['zipcode_5'].values()
    options_table['state'] = df.select('state_abbr').distinct().limit(100).toPandas().to_dict()['state_abbr'].values()
    
    return options_table

options_table = populate_options_table()

def get_trips_layer(df):
    layer = pdk.Layer(
    "TripsLayer",
    df,
    get_path="coordinates",
    get_timestamps="timestamps",
    get_color="color",
    opacity=0.8,
    width_min_pixels=5,
    rounded=True,
    trail_length=600,
    current_time=0,
    )
    r = pdk.Deck(layers=[layer] , initial_view_state=pdk.ViewState(zoom=12,latitude=42.0752, longitude=-88.18402))  #initial_view_state=pdk.data_utils.compute_view(df)
    return dash_deck.DeckGL(r.to_json(), id="map-graph", mapboxKey=mapbox_access_token, style={'height': 'inherit', 'width': 'inherit', 'position':'relative'})


def get_heatmap_layer(df):
    layer = pdk.Layer(
    "HeatmapLayer",
    data=df,
    opacity=0.9,
    get_position=["longitude", "latitude"],
    aggregation='"MEAN"',
    color_range=COLOR_BREWER_BLUE_SCALE,
    threshold=1,
    pickable=True,
    )
    r = pdk.Deck(layers=[layer] , initial_view_state=pdk.ViewState(zoom=12,latitude=42.0752, longitude=-88.18402))  #initial_view_state=pdk.data_utils.compute_view(df)
    return dash_deck.DeckGL(r.to_json(), id="map-graph", mapboxKey=mapbox_access_token, style={'height': 'inherit', 'width': 'inherit', 'position':'relative'})



def get_data(layer,filters,limit=100):
    if not filters: filters = "" 
    print(filters)
    query=f'SELECT device_key, latitude, longitude, unix_time AS timestamps FROM location_table {filters}'
    if limit:
        query +=  f'LIMIT {limit}'
    print(query)
    
    
    pdf = spark.sql(query).toPandas()
    #pdf = pd.DataFrame({'device_key':[4444]*5,'    latitude':[41.0223,44.0223,46.0223,48.0223,49.0223],'longitude':[-81.5446,-82.554,-83.224,-84.7643,-85.7874],
    #                'timestamps':[0, 9, 54, 92, 345] })
    if layer=='TripsLayer':
        pdf['coordinates'] = pdf[['longitude','latitude']].values.tolist()
        pdf['timestamps'] = (pdf['timestamps'] - pdf['timestamps'].min())/1000
        pdf['timestamps'] = pdf['timestamps'].apply(int)
        
        ppdf = pdf.groupby('device_key')['coordinates'].apply(list).reset_index(name='coordinates')
        ppdf['timestamps'] = pdf.groupby('device_key')['timestamps'].apply(list).reset_index(name='timestamps')['timestamps']
        #ppdf['color'] = pdf.groupby('device_key')['color'].apply(list).reset_index(name='color')['color']
        pdf = ppdf
        color_lookup = pdk.data_utils.assign_random_colors(pdf['device_key'])
        # Assign a color based on attraction_type
        pdf['color'] = pdf.apply(lambda row: [233,150,122] , axis=1) #color_lookup.get(str(row['device_key']))
    
        
    pdf.drop(columns=['device_key'],inplace=True)    #pdf['color'] = [[233,150,122]] #[223, 193, 249]
    return pdf


app = dash.Dash(
    __name__, meta_tags=[{"name": "viewport", "content": "width=device-width"}]
    )


app.layout = html.Div(
    id='root',
    children=[
        html.Div(
            id="header",
            children=[
                html.H4(children="LOCATION DATA - MAP DASHBOARD"),
                html.P(
                    id="description",
                    children="This dashboard shows the device location data on a map",
                ),
            ],
        ),
        html.Div(
            className="row",
            style={'margin':'0px 15px'},
            children=[
                     # Column for user controls
                    html.Div(
                    className="three columns div-user-controls chart-container",
                    children=[
                        html.P(
                            """Select different days using the date picker or by selecting
                            different time frames on the histogram."""
                        ),
                        html.Div(
                            className="div-for-dropdown",
                            children=[
                                dcc.DatePickerSingle(
                                    id="date-picker",
                                    min_date_allowed=dt(2014, 4, 1),
                                    max_date_allowed=dt(2014, 9, 30),
                                    initial_visible_month=dt(2014, 4, 1),
                                    date=dt(2014, 4, 1).date(),
                                    display_format="MMMM D, YYYY",
                                    style={"border": "0px solid black"},
                                )
                            ],
                        ),
                        # Change to side-by-side for mobile layout
                        html.Div(
                            className="row",
                            children=[
                                html.Div(
                                    className="div-for-dropdown",
                                    children=[
                                        # Dropdown for locations on map
                                        dcc.Dropdown(
                                            id="device-selector",
                                            options=[
                                                {"label": i, "value": i}
                                                for i in options_table['device_key']
                                            ],
                                            placeholder="Select a device",
                                        )
                                    ],
                                ),
                                html.Div(
                                    className="div-for-dropdown",
                                    children=[
                                        # Dropdown to select times
                                        dcc.Dropdown(
                                            id="hour-selector",
                                            options=[
                                                {
                                                    "label": str(n) + ":00",
                                                    "value": str(n),
                                                }
                                                for n in range(24)
                                            ],
                                            multi=True,
                                            placeholder="Select certain hours",
                                        )
                                    ],
                                ),
                                html.Div(
                                    className="div-for-dropdown",
                                    children=[
                                        # Dropdown to select times
                                        dcc.Dropdown(
                                            id="zipcode-selector",
                                            options=[
                                                {
                                                    "label": n,
                                                    "value": n,
                                                }
                                                for n in options_table['zipcode']
                                            ],
                                            multi=True,
                                            placeholder="Select Zipcode",
                                        )
                                    ],
                                ),
                                html.Div(
                                    className="div-for-dropdown",
                                    children=[
                                        # Dropdown to select times
                                        dcc.Dropdown(
                                            id="state-selector",
                                            options=[
                                                {
                                                    "label": n,
                                                    "value": n,
                                                }
                                                for n in options_table['state']
                                            ],
                                            multi=True,
                                            placeholder="Select State",
                                        )
                                    ],
                                ),
                                
                                html.Div(
                                    className="div-for-dropdown",
                                    children=[
                                        html.P("""Move slider to see trip progress"""),
                                        dcc.Slider(
                                            id="trip-slider",
                                            min=0,
                                            max=100,
                                            step=1,
                                            value=50
                                        )
                                    ]
                                )
                            ],
                        ),
                    
                    ],
                    ),
                    
                html.Div(
                    id='metrics-container',
                    className='three columns',
                    children=[
                    ]
                ),
               
                # Column for map and trend
                html.Div(
                    className="six columns",
                    id='right-pane',
                    children=[
                        
                        html.Div(
                        id='map-container',
                        className="row div-for-charts bg-grey",
                        children=[
                            #get_map_object(get_data_for_trips_layer())
                            #html.Div(
                            #    className="text-padding",
                            #    children=[
                            #        "Select any of the bars on the histogram to section data by time."
                            #    ],
                            #),
                            #dcc.Graph(id="histogram"),
                        ],
                        ),
                        
                    ],
                    ),
                    ]  
                )
            ]
)


def makeFilterQuery(**kwargs):
    
    if not any(kwargs.values()):
        return None
    s = ' WHERE '
    for k,v in kwargs.items():
        if v:
            s += k + ' in ' + str(v) + ' AND '  
    return s.strip(' AND')


@app.callback(
    Output("map-container",'children'),
    [
        Input("date-picker", "date"),
        Input("device-selector", "value"),
        Input("hour-selector", "value"),
        Input("zipcode-selector", "value"),
        Input("state-selector", "value"),
        Input("trip-slider", "value")
    ],
)
def update_graph(datePicked, deviceSelected, hourSelected, zipcodeSelected, stateSelected, sliderValue):
    
    print(datePicked)
    print(sliderValue)
    print(zipcodeSelected)
   
    filters = makeFilterQuery(device_key=deviceSelected, zipcode_5=zipcodeSelected, state_abbr=stateSelected)
    

    layer='HeatmapLayer'
    pdf=get_data(layer,filters,limit=None)
    
    print(pdf)
    print(sdf)
    return get_map_object(layer,pdf)
    
    
    
@app.callback(
    output=Output("metrics-container", "children"),
    inputs=[
        Input("date-picker", "date"),
        Input("device-selector", "value"),
        Input("hour-selector", "value"),
        Input("zipcode-selector", "value"),
        Input("state-selector", "value"),
        Input("trip-slider", "value")
    ])
def update_metrics_container(datePicked, deviceSelected, hourSelected, zipcodeSelected, stateSelected, sliderValue):
    data = go.Data(
        [
            go.Bar(x=[1, 2, 3], y=[4, 1, 2]),
            go.Bar(x=[1, 2, 3], y=[2, 4, 5]),
        ])
    layout = go.Layout(
        title="Top 5 Device Key sorted by duration in seconds",
        height=300,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
        )
        
    filters = makeFilterQuery(device_key=deviceSelected, zipcode_5=zipcodeSelected, state_abbr=stateSelected)
    if not filters: filters = "" 
    query=f'SELECT device_key, sum(min_duration_seconds) AS duration FROM location_table {filters} GROUP BY device_key SORT BY duration DESC LIMIT 5'
    print(query)
    pdf = spark.sql(query).toPandas()
    names=pdf['device_key'].values.tolist()
    values=pdf['duration'].values.tolist()
    
    kpis = html.H2(children='37',style={'font_size': '64px',})
    
    pie_chart = go.Figure(data=[go.Pie(labels=names, values=values)], layout=layout)
 
    
    bar_chart = go.Figure(data=data, layout=layout)
    
    pie_graph= dcc.Graph(id='pie-chart',figure=pie_chart)
    bar_graph=dcc.Graph(id='bar-chart',figure=bar_chart)
    
    
    return kpis, pie_graph , bar_graph




if __name__ == "__main__":
    app.run_server(host="0.0.0.0",debug=True)