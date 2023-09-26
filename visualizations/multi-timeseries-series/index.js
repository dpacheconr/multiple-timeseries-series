import React, { useState, useEffect} from 'react';
import {NrqlQuery, Spinner,Grid,GridItem} from 'nr1';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,Area} from 'recharts';
import { CSVLink } from "react-csv"


// Global variables
const defaultColors=['#e6194b', '#3cb44b', '#000000', '#f58231', '#911eb4', '#f032e6', '#bcf60c', '#008080', '#9a6324', '#800000', '#808000', '#000075', '#808080', '#000000']

let trimmedareaset = []
let minmaxareaset = []
let trimpercent = 10
let avgbol = false
let minmaxareabol = false
let trimmedareabol = false
let intwitdh = 1500
let intheight = 450
let margintop = 5
let marginright= 30
let marginleft= 20
let marginbottom= 5


function avgfunction (array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return parseInt(sum / array.length)
}

function exportToCsv (data){
    let newdata = []

    data.forEach(el => {
        el.data.forEach(subel => {
            newdata.push(subel)
        })
    })

    let keys = ["x","y","begin_time","end_time"]
    let sorteddata=[]
    var sorted = [];
    newdata.map(el => {
        for(var key in el) {
            if (!sorted.includes(key)){
                sorted[0] = "x";
                sorted[1] = "begin_time";
                sorted[2] = "end_time";
                sorted[3] = "y";
                if (!keys.includes(key)){
                   sorted[sorted.length] = key
            }}}

    })  
    newdata.map(el => {
        var tempDict = {};
        for(var i = 0; i < sorted.length; i++) {
            tempDict[sorted[i]] = el[sorted[i]];
        }
        sorteddata.push(tempDict)
    })
    sorteddata.sort(function(a, b) {
        var keyA = a.x,
          keyB = b.x;
        // Compare the 2
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

    return sorteddata
  }


function build_json(z,i,array,value) {
    let datatopass={}
    datatopass.begin_time=z.begin_time
    datatopass.end_time=z.end_time
    datatopass.x=z.x
    datatopass.y=array[i]
    datatopass[value]=array[i]
    return datatopass
}


function parse_data(array) {
    let sets = []
    array.forEach(el => {
        sets.push(el)
    })
    return sets
}


function calculatedata(data) {
    let controlarray = []
    let resultarray = []

    let minarraycontrol = []
    let maxarraycontrol = []
    let lowarraycontrol = []
    let higharraycontrol = []
    let arrayrangecontrol = []
    let avgarrcontrol = []
    let minmaxareacontrol=[]


    let datanames = ["min","max","lowes","highes","avg"]

    for (let i = 0; i < data[0].data[0].data.length; i++) {
        data.forEach((z)=>{
            let name = z.data[0].metadata.name
            if (!datanames.includes(name)){
                controlarray.push(z.data[0].data[i].y)
            }
           
        })
        let minmaxarea= []
        let avgarr =  []
        let minarray = []
        let maxarray = []
        let arrayrange = []
        let lowarray= []
        let higharray= []
        
        resultarray.push(controlarray)
        controlarray = []

        resultarray.forEach(array => {
            let minValue = Infinity;
            let maxValue = -Infinity;
            for (let item of array) {
        
                // Find minimum value
                if (item < minValue)
                    minValue = item;
        
                // Find maximum value
                if (item > maxValue)
                    maxValue = item;                
            } 

            avgarr.push(avgfunction(array))

            minarray.push(minValue)
            maxarray.push(maxValue)

            minmaxarea.push([minValue,maxValue])

            let mins = ((maxValue - minValue)*(trimpercent/100))+minValue
            let maxs = maxValue - ((maxValue - minValue)*(trimpercent/100))


            lowarray.push(mins)
            higharray.push(maxs)

            arrayrange.push([mins,maxs])
            
        })

        let z = data[0].data[0].data[i]

        minarraycontrol.push(build_json(z,i,minarray,"min"))
        maxarraycontrol.push(build_json(z,i,maxarray,"max"))
        arrayrangecontrol.push(build_json(z,i,arrayrange,"arrayrange"))
        lowarraycontrol.push(build_json(z,i,lowarray,"lowarray"))
        higharraycontrol.push(build_json(z,i,higharray,"higharray"))
        avgarrcontrol.push(build_json(z,i,avgarr,"avgarr"))
        minmaxareacontrol.push(build_json(z,i,minmaxarea,"minmaxarea"))

    } 

    let minset = parse_data (minarraycontrol)
    let maxset = parse_data (maxarraycontrol)
    let trimmedminset = parse_data (lowarraycontrol)
    let trimmedmaxset = parse_data (higharraycontrol)
    let avgset = parse_data (avgarrcontrol)
    trimmedareaset = parse_data (arrayrangecontrol)
    minmaxareaset = parse_data (minmaxareacontrol)


    // push data with hardcoded colours
    data.push({"data":[{"data":minset, "metadata":{"viz":"main","name": "min","id":"625D011FAC794651F25160AD89612DFAAE954C0CB", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":maxset, "metadata":{"viz":"main","name": "max","id":"DDB4E3844C923B3F794EC52642E22CBE9FC8D8D31", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedminset, "metadata":{"viz":"main","name": "lowes","id":"02D6A84F7B97E4709A11276615FDAAB3EE2BEE415", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":trimmedmaxset, "metadata":{"viz":"main","name": "highes","id":"2C1F4F2BAA2800FD80F50C3811F38D03B52DEEEB1", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
    data.push({"data":[{"data":avgset, "metadata":{"viz":"main","name": "avg","id":"74B5B05EEA583471E03DCBF0123D81CC79CAE0FE9", "color": defaultColors[Math.floor(Math.random() * defaultColors.length)]}}],loading: false, error: null})
}

function AlignedTimeseries(props) {
    const {nrqlQueries, alignment, configuration} = props;
    const [queryResults, setQueryResults] = useState(null);
        
    useEffect(async () => { 
            let mainquery = props.nrqlQueries[0].query
            let compare= props.nrqlQueries[0].compare
            let timeseries= props.nrqlQueries[0].timeseries
            let aggregator= props.nrqlQueries[0].aggregator
            avgbol = props.nrqlQueries[0].average
            minmaxareabol = props.nrqlQueries[0].minmaxareabol
            trimmedareabol = props.nrqlQueries[0].trimmedareabol

            if (props.nrqlQueries[0].trimpercent != "") {
                trimpercent = props.nrqlQueries[0].trimpercent
            }
            if (props.configuration[0].width != "") {
                intwitdh = parseInt(props.configuration[0].width)
            }
            if (props.configuration[0].height != "") {
                intheight = parseInt(props.configuration[0].height)
            }
            if (props.configuration[0].margintop != "") {
                margintop = parseInt(props.configuration[0].margintop)
            }
            if (props.configuration[0].marginright != "") {
                marginright= parseInt(props.configuration[0].marginright)
            }
            if (props.configuration[0].marginleft != "") {
                marginleft= parseInt(props.configuration[0].marginleft)
            }
            if (props.configuration[0].marginbottom != "") {
                marginbottom= parseInt(props.configuration[0].marginbottom)
            }

            let query1= mainquery + " SINCE 1 " + aggregator + " ago TIMESERIES " + timeseries
            props.nrqlQueries[0].query = query1
            // generate the compare queries
            for (let i = 1; i < compare; i++) {
                let query= mainquery + " SINCE " + (i+1) + " " + aggregator + " ago until "+ i +  " " + aggregator + " " + "ago TIMESERIES " + timeseries
                nrqlQueries.push({accountId: 3428733, query: query, color: defaultColors[i]})
              }

            let promises=nrqlQueries.map((q)=>{return NrqlQuery.query({accountIds: [q.accountId], query: q.query,formatTypeenum: NrqlQuery.FORMAT_TYPE.CHART})})
            let data = await Promise.all(promises)

            // name the queries and update the colours
            let count = 1
            data.forEach(el => {
                if (count != 1){
                    el.data[0].metadata.name = data[0].data[0].metadata.name+(count-1)
                    el.data[0].metadata.color = defaultColors[Math.floor(Math.random() * defaultColors.length)]
                }
                count ++
            })
            calculatedata(data)
            setQueryResults(data)
     },[props]);

    if(queryResults ) {
        let seriesAlignment = !alignment || alignment =="" ? "start" : alignment
        const determineComparisonPoint = (r) => {
            let comparisonPoint
            switch(seriesAlignment) {
                case "middle":
                    let midpoint = parseInt((r.data[0].data.length / 2)) - 1
                    comparisonPoint = comparisonPoint = r.data[0].data[ midpoint].x
                    break;
                case "end":
                    comparisonPoint = r.data[0].data[r.data[0].data.length-1].x
                    break;
                default:
                    comparisonPoint = r.data[0].data[0].x
            }
            return comparisonPoint
        }

        //start alignment
        let latest=0
        queryResults.forEach((r)=>{
            if(r.data && r.data[0] && r.data[0].metadata && r.data[0].data) {
                let comparisonPoint=determineComparisonPoint(r)
                if(comparisonPoint > latest) {
                    latest=comparisonPoint
                }
            }
        })

        if(queryResults ) {
            
        }
        queryResults.forEach((r,idx)=>{
            if(r.data && r.data[0] && r.data[0].metadata && r.data[0].data) {
                let comparisonPoint=determineComparisonPoint(r)
                let resultSetBeginTime=comparisonPoint
                let offset=latest-resultSetBeginTime
                if(offset > 0) {
                    r.data[0].data.forEach((row)=>{
                        row.x= row.x + offset
                    })
                } 
            }
        })

        
          
        //determine latest result set, we'll align everything to that one
        let vizchartData=[]
        let exportchartData=[]
        let linechartdata = []
        queryResults.forEach(r=>{ if(r.data && r.data[0]) {exportchartData.push(r.data[0])}}) 
        queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name != "min" && r.data[0].metadata.name != "max" && r.data[0].metadata.name != "lowes" && r.data[0].metadata.name != "highes" && r.data[0].metadata.name != "avg") ){vizchartData.push(r.data[0])}}) 
        if( avgbol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "avg") ){linechartdata.push(r.data[0])}})
        }
        if( trimmedareabol == false ) {
            trimmedareaset = []
        }
        if( minmaxareabol == false ) {
            minmaxareaset = []
        }
        let outTable= <>
        <CSVLink filename="QueryData.csv" data={exportToCsv(exportchartData)}>Download data as CSV</CSVLink>
        </>
        return <div><ComposedChart width={intwitdh} height={intheight}
        margin={{
            top: margintop,
            right: marginright,
            left: marginleft,
            bottom: marginbottom,
          }}
          >
          <CartesianGrid strokeDasharray="3 3" /> 
          <XAxis dataKey="x"  type="category"  allowDuplicatedCategory={false}/>
          <YAxis  dataKey="y" type="number" domain={['datamin - 10', 'dataMax + 10']} />
          {/* domain={['datamin - 1000', 'dataMax + 1000']} */}
          <Tooltip />
          <Legend />
          {vizchartData.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={2} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>
          ))
          }
          {
          linechartdata.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={5} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>))
          }   
          {/* type'basis' | 'basisClosed' | 'basisOpen' | 'bumpX' | 'bumpY' | 'bump' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter' | Function */}
          <Area type="monotone" fill="darkblue" dataKey="y" data={trimmedareaset} name="TrimmedArea" strokeWidth={0}/>
          <Area type="monotone" fill="lightgrey" dataKey="y" data={minmaxareaset} name="MinMaxArea" strokeWidth={0}/>
        </ComposedChart>
        <Grid>
            <GridItem columnSpan={12}>
            {outTable}
            </GridItem>
        </Grid>
        </div>

    } else {
        return <div className="EmptyState">
                <div className="loader"><Spinner inline/> Loading and aligning data...</div>
            </div>
        
    }
  }

  
export default AlignedTimeseries;
