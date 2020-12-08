from flask import Flask, escape, request
from flask_cors import  cross_origin
from flask import current_app, flash, jsonify, make_response, redirect, request, url_for


from functools import reduce
import pandas as pd

app = Flask(__name__)


allowed_keys = ['device_key' , 'lat', 'long', 'duration', 'state', 'zipcode', 'observation_count' ]

@app.route('/get_data', methods=['GET','POST'])
@cross_origin()
def get_data():
    global df
    
    try:
        print(request.json)
        selections = request.json
        #pdb.set_trace()
        
        filters = '(' + ') & ('.join([ k + '==' + str(selections.get(k)) for k in selections.keys() if k in allowed_keys and k != '']) + ')'
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
        df1 = df
        print(expr)
        if expr.strip():
            df1 = df.query(expr)
        
        json_df= df1.iloc[:int(selections.get("max_items",200))].to_json(orient='columns')
        
        #cond = reduce(lambda x,y: x&y, [ col(k)==v for k,v in selected_columns.items() ])
        #df = df.filter(cond).toPandas()
        
        response = json_df
    except Exception as e:
        response = {'error':'Exception while fetching data:'+str(e)}
    
    return response



datetime_valid_keys = ['hour','seconds','minutes','date','day','month','year']

@app.route('/get_form_fields', methods=['GET'])
@cross_origin()
def get_form_fields():
    global df
    print(request.args)
    #pdb.set_trace()
    col = request.args.get("column")
    key = request.args.get("key")
    if not col or not key:
        return {'error':'Specify column as column name form which to search and key as search value. Can be only done on str columns'}
    
    if col in datetime_valid_keys:
        
    
    if ((df[col].dtype != 'object')):
        return {'error': 'This endpoint can only return searches on str dataypes'}
    
    
    retlist = df[df[col].str.contains(key,case=False)][col].unique()[:int(request.args.get("max_items",10))].tolist()
    response={col:retlist}
    print(response)
    return response


import pdb

if __name__ == "__main__":
    lst_str_cols = ['device_key','zipcode']
    df = pd.read_parquet('../../data/tmp.parquet', engine='pyarrow')
    df = df.rename(columns={ 'device_key':'device_key',
                        'latitude':'lat',
                        'longitude':'long',
                        'min_duration_seconds':'duration',
                        'state_abbr':'state',
                        'zipcode_5':'zipcode'
                        })
    
    df['device_key'] = df['device_key'].apply(str)
    df['zipcode'] = df['zipcode'].apply(str)
    df.drop(columns=['datetime', 'datetime_str_time','datetime_end_time'],inplace=True)
    df['datetime'] = pd.to_datetime(df['unix_time'])
    df = df.set_index('datetime')
    #df.reset_index(inplace=True)
    app.run(host='0.0.0.0')
