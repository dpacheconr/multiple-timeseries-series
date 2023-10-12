/* eslint-disable react/prop-types */

import React, { useState, useEffect, useContext} from 'react';
import {NrqlQuery, Spinner,Grid,GridItem,AutoSizer,PlatformStateContext} from 'nr1';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,Area,ReferenceDot, ReferenceArea, ReferenceLine} from 'recharts';
import { CSVLink } from "react-csv"

import moment from 'moment-timezone';
import { array } from 'prop-types';

import chroma from "chroma-js";

// Global variables
var _ = require('lodash');

let c_accountid
let trimpercent = 10
let clipSize=2
let avgbol = false

const DefaultWindowSizeMoment=moment.duration("PT1H")


function avgfunction (array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return parseInt(sum / array.length)
}

function clipFunction (dataArray,size) {
    let sorted = dataArray.sort(function(a, b){return a - b});
    let clipped=sorted.slice(size,sorted.length-size)
    return clipped
}

function getMinMax(data) {
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let item of data) {
        // Find minimum value
        if (item < minValue)
            minValue = item;

        // Find maximum value
        if (item > maxValue)
            maxValue = item;                
    } 
    return [minValue,maxValue]
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





function AlignedTimeseries(props) {
    const {
        grp_data,
        grp_window,
        grp_history,
        grp_layers,
        grp_display,
        conf_referenceareas
    } = props;

        // !! The creator returns nulls and empty string, the editor undefined!
        //grp_data
        const conf_accountId = !grp_data ? null : grp_data.conf_accountId == undefined ? null : grp_data.conf_accountId ;
        const conf_query = !grp_data ? null : grp_data.conf_query  == undefined ? null :grp_data.conf_query;
        const conf_timeseries = !grp_data ? null : grp_data.conf_timeseries  == undefined ? null : grp_data.conf_timeseries;
        const conf_timezone = !grp_data ? null : grp_data.conf_timezone  == undefined ? "UTC" : grp_data.conf_timezone;

        //grp_window
        const conf_startunixtime = !grp_window ? null : grp_window.conf_startunixtime  == undefined ? null :grp_window.conf_startunixtime ;
        const conf_endunixtime = !grp_window ? null :grp_window.conf_endunixtime  == undefined ? null :grp_window.conf_endunixtime;
        const conf_duration = !grp_window ? null :grp_window.conf_duration  == undefined ? null :grp_window.conf_duration;
        const conf_startfromnow = !grp_window ? null :grp_window.conf_startfromnow  == undefined ? null :grp_window.conf_startfromnow;
        const conf_endfromnow = !grp_window ? null :grp_window.conf_endfromnow  == undefined ? null :grp_window.conf_endfromnow;
        const conf_todaystarttime = !grp_window ? null :grp_window.conf_todaystarttime  == undefined ? null :grp_window.conf_todaystarttime;
        const conf_todayendtime = !grp_window ? null :grp_window.conf_todayendtime == undefined ? null : grp_window.conf_todayendtime;

        //grp_history
        const conf_compare = !grp_history ? null : grp_history.conf_compare == undefined ? null : grp_history.conf_compare;
        const conf_comparestepsize = !grp_history ? null : grp_history.conf_comparestepsize == undefined ? null : grp_history.conf_comparestepsize;
        
        //grp_layers
        const conf_hideoriginaldata = !grp_layers ? null : grp_layers.conf_hideoriginaldata == undefined ? null : grp_layers.conf_hideoriginaldata;
        const conf_average = !grp_layers ? null : grp_layers.conf_average == undefined ? null : grp_layers.conf_average;
        const conf_minmaxareabol = !grp_layers ? null : grp_layers.conf_minmaxareabol == undefined ? null : grp_layers.conf_minmaxareabol;
        const conf_trimmedareabol = !grp_layers ? null : grp_layers.conf_trimmedareabol == undefined ? null : grp_layers.conf_trimmedareabol;
        const conf_trimpercent = !grp_layers ? null : grp_layers.conf_trimpercent == undefined ? null : grp_layers.conf_trimpercent;
        const conf_clippedareabol = !grp_layers ? null : grp_layers.conf_clippedareabol == undefined ? null : grp_layers.conf_clippedareabol;
        const conf_clipsize = !grp_layers ? null : grp_layers.conf_clipsize == undefined ? null : grp_layers.conf_clipsize;

        //grp_display
        const conf_alignment = !grp_display ? null :  grp_display.conf_alignment == undefined ? null : grp_display.conf_alignment;
        const conf_refreshrate = !grp_display ? null : grp_display.conf_refreshrate == undefined ? null : grp_display.conf_refreshrate;
        const conf_yaxislabel = !grp_display ? null : grp_display.conf_yaxislabel == undefined ? null : grp_display.conf_yaxislabel;
        const conf_yaxismax = !grp_display ? null : grp_display.conf_yaxismax == undefined ? null : grp_display.conf_yaxismax;
        const conf_yaxismin = !grp_display ? null : grp_display.conf_yaxismin == undefined ? null : grp_display.conf_yaxismin;
        const conf_showdots = !grp_display ? null : grp_display.conf_showdots == undefined ? null : grp_display.conf_showdots;
        const conf_colortheme = !grp_display ? null : grp_display.conf_colortheme == undefined ? null : grp_display.conf_colortheme;
        const conf_datetimestringformat_xaxis = !grp_display ? null : grp_display.conf_datetimestringformat_xaxis == undefined ? null : grp_display.conf_datetimestringformat_xaxis;
        const conf_datetimestringformat_tooltip = !grp_display ? null : grp_display.conf_datetimestringformat_tooltip == undefined ? null : grp_display.conf_datetimestringformat_tooltip;
        const conf_gridbol = !grp_display ? null : grp_display.conf_gridbol == undefined ? false : grp_display.conf_gridbol;
        

 

    function convertTimestampToDate(timestamp,objname,windowsize) {
        var output
        if (objname == "tooltip"){
            let formatter= (conf_datetimestringformat_tooltip === null || conf_datetimestringformat_tooltip==="") ? "YYYY/MM/DD hh:mm:ss" : conf_datetimestringformat_tooltip
            output = moment.tz(timestamp,conf_timezone).format(formatter)
        } else {
            let formatter='YYYY/MM/DD HH:mm'
            if(conf_datetimestringformat_xaxis === null || conf_datetimestringformat_xaxis==="") {
                //automatic formatting of dates based on window size
                let winsizesecs=windowsize/1000
                if(winsizesecs <= moment.duration("PT1H").asSeconds()) {
                    formatter="HH:mm:ss"
                } else if(winsizesecs <= moment.duration("PT24H").asSeconds()) {
                    formatter="HH:mm"
                } else if( winsizesecs <= moment.duration("P31D").asSeconds() ){
                    formatter="YYYY/MM/DD HH:mm"
                } else {
                    formatter="YYYY/MM/DD hha"
                }
            } else {
                formatter=conf_datetimestringformat_xaxis
            }
            output = moment.tz(timestamp,conf_timezone).format(formatter);
        }
        return output
    }
    function exportToCsv (querydataImput){
        var querydata = _.cloneDeep(querydataImput);
        let keys = ["begin_time","end_time","x","y"]
        let data=querydata.slice(1,querydata.length)
    
        var c_newdata = _.cloneDeep(querydata[0]);
    
        data.forEach(array => {
            array.data.forEach((dict,index) => {
                    for (let key in dict){
                        if (!keys.includes(key)){
                            c_newdata.data[index][key] = dict[key]
                            // also delete unwanted keys in this loop
                            delete c_newdata.data[index]["x"]
                            delete c_newdata.data[index]["y"]
                    }
            }
            })
        })
    
        let sorted = []
        for(var key in c_newdata.data[0]) {
            sorted[0] = "begin_time"
            sorted[1] = "end_time"
            if (key != "begin_time" && key != "end_time"){
                sorted[sorted.length] = key
            }
        }
    
        let output = []
    
        c_newdata.data.forEach(array => {
            var tempDict = {};
            for(var i = 0; i < sorted.length; i++) {   
                if (i <=1) {
                    let c_key = String(sorted[i])
                    let item_val = convertTimestampToDate(array[sorted[i]])
                    tempDict[c_key]= item_val
                } else {
                let c_key = String(sorted[i])
                let item_val = array[sorted[i]]
                tempDict[c_key]=item_val
                }
            }
            output.push(tempDict)
        }
        )
        return output
    }

    function calculatedata(data) {
   
        let resultarray = []
    
        let minmaxminsctrl = []
        let minmaxmaxsctrl = []
        let trimmedminctrl = []
        let trimmedmaxctrl = []
        let trimmedareactrl = []
        let clippedminctrl = []
        let clippedmaxctrl = []
        let clippedareactrl = []
        let avgarrctrl = []
        let minmaxareactrl=[]
    
    
        for (let i = 0; i < data[0].data[0].data.length; i++) {     //iterate over each bucket, using the first series as control
            let ctrlarray = [] //this is the y values for the current i'th bucket 
            data.forEach((z,idx)=>{
                if (idx > 0) { //we dont want to include the most recent series in the data
                    ctrlarray.push(z.data[0].data[i].y)
                 }  
            })
            resultarray.push(ctrlarray)
        } 
    
        let avgarr =  []
    
        let trimmedarea = []
        let trimmedmin= []
        let trimmedmax= []
    
        let minmaxarea= []
        let minmaxmins = []
        let minmaxmaxs = []
    
        let clippedarea = []
        let clippedmin = []
        let clippedmax = []
    
    
            resultarray.forEach((yvalues) => {
    
                let minMax = getMinMax(yvalues)
                let minValue = minMax[0]
                let maxValue =  minMax[1]
    
                avgarr.push(avgfunction(yvalues))
    
                let mins = parseInt(((maxValue - minValue)*(trimpercent/100))+minValue)
                let maxs = parseInt(maxValue - ((maxValue - minValue)*(trimpercent/100)))
                
                if (trimpercent == undefined){
                    trimpercent = 10
                }
                if (clipSize == undefined){
                    clipSize = 1
                }
    
                trimmedmin.push(mins)
                trimmedmax.push(maxs)
                trimmedarea.push([mins,maxs])
    
                minmaxmins.push(minValue)
                minmaxmaxs.push(maxValue)
                minmaxarea.push([minValue,maxValue])       
    
                //determine clipped area
                let clippedData=clipFunction(yvalues,parseInt(clipSize))
                let c_area = getMinMax(clippedData)
                clippedarea.push(c_area)
                clippedmin.push(c_area[0])
                clippedmax.push(c_area[1])
    
            })
    
            for (let i = 0; i < data[0].data[0].data.length; i++) {  
                let z = data[0].data[0].data[i]
    
                avgarrctrl.push(build_json(z,i,avgarr,"avg"))
    
                trimmedareactrl.push(build_json(z,i,trimmedarea,"trimmedarea"))
                trimmedminctrl.push(build_json(z,i,trimmedmin,"trimmedmin"))
                trimmedmaxctrl.push(build_json(z,i,trimmedmax,"trimmedmax"))
    
                minmaxareactrl.push(build_json(z,i,minmaxarea,"minmaxarea"))
                minmaxminsctrl.push(build_json(z,i,minmaxmins,"min"))
                minmaxmaxsctrl.push(build_json(z,i,minmaxmaxs,"max"))
    
                clippedminctrl.push(build_json(z,i,clippedmin,"clippedmin"))
                clippedmaxctrl.push(build_json(z,i,clippedmax,"clippedmax"))
                clippedareactrl.push(build_json(z,i,clippedarea,"clippedarea"))
    
            }
    
        let avgset = parse_data (avgarrctrl)
        let trimmedareaset = parse_data (trimmedareactrl)
        let trimmedminset = parse_data (trimmedminctrl)
        let trimmedmaxset = parse_data (trimmedmaxctrl)
        let minmaxareaset = parse_data (minmaxareactrl)
        let minset = parse_data (minmaxminsctrl)
        let maxset = parse_data (minmaxmaxsctrl)
        let clippedareaset = parse_data(clippedareactrl)
        let clippedminset = parse_data(clippedminctrl)
        let clippedmaxset = parse_data(clippedmaxctrl)
    
      
        // update queries with calculated data
        data.push({"data":[{"data":avgset, "metadata":{"viz":"main","name": "avg","id":"74B5B05EEA583471E03DCBF0123D81CC79CAE0FE9", "color": getColor(1)}}],loading: false, error: null})
        data.push({"data":[{"data":trimmedareaset, "metadata":{"viz":"main","name": "trimmedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CEE0FE9", "color":getColor("trimmedArea")}}],loading: false, error: null})
        data.push({"data":[{"data":trimmedminset, "metadata":{"viz":"main","name": "trimmedmin","id":"02D6A84F7B97E4709A11276615FDAAB3EE2BEE415", "color": getColor(2)}}],loading: false, error: null})
        data.push({"data":[{"data":trimmedmaxset, "metadata":{"viz":"main","name": "trimmedmax","id":"2C1F4F2BAA2800FD80F50C3811F38D03B52DEEEB1", "color":getColor(2)}}],loading: false, error: null})
        data.push({"data":[{"data":clippedareaset, "metadata":{"viz":"main","name": "clippedarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0JE8", "color": getColor("clippedArea")}}],loading: false, error: null})
        data.push({"data":[{"data":clippedminset, "metadata":{"viz":"main","name": "clippedmin","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0LE8", "color": getColor(3)}}],loading: false, error: null})
        data.push({"data":[{"data":clippedmaxset, "metadata":{"viz":"main","name": "clippedmax","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE8", "color": getColor(3)}}],loading: false, error: null})
        data.push({"data":[{"data":minmaxareaset, "metadata":{"viz":"main","name": "minmaxarea","id":"74B5B05EEA583471E03DCBF0123D81CC79CDE0FE9", "color": getColor("minmaxArea")}}],loading: false, error: null})
        data.push({"data":[{"data":minset, "metadata":{"viz":"main","name": "min","id":"625D011FAC794651F25160AD89612DFAAE954C0CB", "color":getColor(3)}}],loading: false, error: null})
        data.push({"data":[{"data":maxset, "metadata":{"viz":"main","name": "max","id":"DDB4E3844C923B3F794EC52642E22CBE9FC8D8D31", "color": getColor(3)}}],loading: false, error: null})
       
    }

    if(conf_accountId == null || conf_accountId== "" || conf_query == null || conf_query == "") {
        return <div className="EmptyState">
         <div className="loader">Please configure a data source query.</div>
        </div>
    }
    
    let fadeColorSize=20
    if(conf_compare!=="" && conf_compare!=null) {
        fadeColorSize=parseInt(conf_compare);
    }
    
    const colorThemes={

        "pale": {
            primary: "#f58231",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'],
        },
        "strong": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'],
        },
        "greyfade": {
            primary: "#0d66d4",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: chroma.scale(['#c9c9c9', '#f2f2f2']).colors(fadeColorSize),
        },
        "bluefade": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: chroma.scale(['#5689c7', '#dae4f0']).colors(fadeColorSize),
        },
        "retrometro": {
            primary: "green",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history: ["#ea5545", "#f46a9b", "#ef9b20", "#edbf33", "#ede15b", "#bdcf32", "#87bc45", "#27aeef", "#b33dc6"]
        },
        "dutchfield": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0"]
        },
        "pinkblack": {
            primary: "#0d66d4",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  ["#2e2b28", "#3b3734", "#474440", "#54504c", "#6b506b", "#ab3da9", "#de25da", "#eb44e8", "#ff80ff"].reverse()
        },
        "brewer-YlGnBu": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  chroma.scale('YlGnBu').colors(fadeColorSize).reverse()
        },
        "brewer-RdPu": {
            primary: "#c25f19",
            clippedArea: "#22DC6499",
            trimmedArea: "#0262BC66",
            minmaxArea: "#66666666",
            history:  chroma.scale('RdPu').colors(fadeColorSize).reverse()
        }
       
        
    }

    function getColor(index) {
        let theme = (conf_colortheme !== null && conf_colortheme!=="") ? conf_colortheme:  "pale" ;
        let colorTheme=colorThemes[theme];
        if(colorTheme[index]) {
            return colorTheme[index]
        } else {
            let numColors=colorTheme.history.length;
            const chosen =  index % numColors;
            return colorTheme.history[chosen]
        }
    }

    const [queryResults, setQueryResults] = useState(null);
    const [globalError, setGlobalError] = useState(null);
    const [windowsizeMoment, setWindowsizeMoment] = useState(DefaultWindowSizeMoment.clone());
    
    let timeRangeMoment;
    let overrideTimePicker=false;



    //determine time window overrides
    let startMoment = null;
    let endMoment = null;
    let durationMoment=moment.duration("PT1H"); //default if none supplied
    let historicalStepSizeMoment=moment.duration("P7D");



    //parsing period data
    if(conf_duration !=="" && conf_duration !==null) {
        console.log("Parsed duration",moment.duration("P"+conf_duration).asSeconds())
        parsedDuration=moment.duration("P"+conf_duration).asSeconds() * 1000;
        durationMoment=moment.duration("P"+conf_duration)
    }
    if(conf_comparestepsize !=="" && conf_comparestepsize !==null) {
        console.log("Parsed step size",moment.duration("P"+conf_comparestepsize).asSeconds())
        historicalStepSize=moment.duration("P"+conf_comparestepsize).asSeconds() * 1000; 
        historicalStepSizeMoment=moment.duration("P"+conf_comparestepsize)
    }


    //moment stuff----------


    // Hard coded window
    if(conf_startunixtime!=="" && conf_startunixtime !== null) {
        startMoment=moment.unix(parseInt(conf_startunixtime) * 1000)
    }
    if(conf_endunixtime!=="" && conf_endunixtime !== null) {
        endMoment=moment.unix(parseInt(conf_endunixtime) * 1000)
    }

    //Offset form now window
    if(conf_startfromnow !=="" && conf_startfromnow !==null) {
        startMoment=moment.tz(conf_timezone).subtract(moment.duration("P"+conf_startfromnow))
    }
    if(conf_endfromnow !=="" && conf_endfromnow !==null) {
        endMoment=moment.tz(conf_timezone).add(moment.duration("P"+conf_endfromnow))
    }


    //Freetext hour
    if(conf_todaystarttime!=="" && conf_todaystarttime!==null) {
        startMoment = moment.tz(conf_todaystarttime, "hhmm",conf_timezone);
    }
    if(conf_todayendtime!=="" && conf_todayendtime!==null) {
        endMoment=moment.tz(conf_todayendtime, "hhmm",conf_timezone);
    }
   


    //moment version
    if(startMoment && endMoment) {     //start and end time provided
        console.log("Start and end time provided",startMoment.format(),endMoment.format())
        timeRangeMoment = {
            begin_time: startMoment.clone(),
            duration: null, 
            end_time: endMoment.clone()
        };
        overrideTimePicker=true;
    } else if(startMoment &&  durationMoment ) {  // start and duration provided
        console.log("Start and duration provided", startMoment.format(), durationMoment.valueOf())
        timeRangeMoment = {
            begin_time: startMoment.clone(),
            duration: null, 
            end_time: startMoment.clone().add(durationMoment)
        };
        overrideTimePicker=true;
    } else if(endMoment && durationMoment) { // end and duration provided
        console.log("End and duration provided", endMoment.format(),endMoment.format("x"), durationMoment.valueOf())
        timeRangeMoment = {
            begin_time: endMoment.clone().subtract(durationMoment),
            duration: null, 
            end_time: endMoment.clone()
        };
        overrideTimePicker=true;
    } else if( durationMoment) { // just duration provided, assume thats a since duration time ago until now
        console.log("Just duration provided", durationMoment.valueOf())
        timeRangeMoment = {
            begin_time: null,
            duration: durationMoment.clone(), 
            end_time: null
        };
        overrideTimePicker=true;
    } else {
        console.log("Shouldnt be here")
    }

    // Often provided by the PlatformState provider, but not when in first creation mode
    // const ctx = {tvMode: false, accountId: c_accountid, filters: undefined}

    // const cplatformstatecontext = ctx
    // useContext(PlatformStateContext);
 


    // Use during production
    const cplatformstatecontext = useContext(PlatformStateContext);

    async function  dataLoader() {
        c_accountid = conf_accountId
        let mainquery = conf_query
        avgbol = conf_average
        let nrqlQueries = [{accountId: c_accountid, query: conf_query, color: getColor('primary')} ]
    
        if (conf_trimpercent != "") {
            trimpercent = conf_trimpercent
        }
        if (conf_clipsize != "") {
            clipSize = conf_clipsize
        }
    
        if(overrideTimePicker) { // if a fixed window has been provided then we use that instead of any values delivered via the time picker.
            //tempoary unix removal test
            cplatformstatecontext.timeRange={}
            cplatformstatecontext.timeRange.begin_time_moment=timeRangeMoment.begin_time  ;
            cplatformstatecontext.timeRange.end_time_moment=timeRangeMoment.end_time ;
            cplatformstatecontext.timeRange.duration_moment=timeRangeMoment.duration;
        } else {
            //data provided by time picker.
            cplatformstatecontext.timeRange.begin_time_moment=timeRange.begin_time == null ? null : moment(timeRange.begin_time) ;
            cplatformstatecontext.timeRange.end_time_moment=timeRange.end_time == null ? null : moment(timeRange.end_time) ;
            cplatformstatecontext.timeRange.duration_moment=timeRange.duration  == null ? null : moment.duration(duration) ;
        }
    
    
         //the amount to shift each window back in time

            //moment version
            let sinceTimeMoment, untilTimeMoment ;
            if (cplatformstatecontext.timeRange && cplatformstatecontext.timeRange.duration_moment == null){ //timepicker chosen start and end time
                console.log("Time range set by start/end time")
                setWindowsizeMoment( moment.duration(cplatformstatecontext.timeRange.end_time_moment.diff(cplatformstatecontext.timeRange.begin_time_moment)) );
                sinceTimeMoment = cplatformstatecontext.timeRange.begin_time_moment
                untilTimeMoment = cplatformstatecontext.timeRange.end_time_moment
            } else if(cplatformstatecontext.timeRange && cplatformstatecontext.timeRange.duration != null) {  //timepicker value is relative
                console.log("Time range set by duration")
                untilTimeMoment = moment.tz(conf_timezone)
                sinceTimeMoment =  untilTimeMoment.clone().subtract(cplatformstatecontext.timeRange.duration_moment);
                setWindowsizeMoment(moment.duration(untilTimeMoment.diff(sinceTimeMoment)))
            } else {
                console.log("Time range not set, using default")
                //no value set, use a default value
                untilTimeMoment = moment.tz(conf_timezone)
                sinceTimeMoment =  untilTimeMoment.clone().subtract( DefaultWindowSizeMoment );
                setWindowsizeMoment(DefaultWindowSizeMoment)
            }         

    
            let numCompare = (conf_compare !== null && conf_compare !== "") ? parseInt(conf_compare)  : 0        //default to no compare
            let timeseriesOption= (conf_timeseries !== null && conf_timeseries !== "") ? conf_timeseries : "AUTO"  // default to auto timeseries
            
            //moment version
            for (let i = 0; i <= numCompare; i++) {
                let step = historicalStepSizeMoment.asSeconds() > 0 ? moment.duration(historicalStepSizeMoment.asMilliseconds() * i) : moment.duration(windowsizeMoment*1);
                let from = sinceTimeMoment.clone().subtract( step ).format("YYYY-MM-DD HH:mm:ss") 
                let until = untilTimeMoment.clone().subtract( step).format("YYYY-MM-DD HH:mm:ss") 
                let query = mainquery + " SINCE '" + from + "' until '"+ until  + "' WITH TIMEZONE '" + conf_timezone + "' TIMESERIES " + timeseriesOption
                if (i == 0 ) { 
                    nrqlQueries[0].query = query  
                } else {
                    nrqlQueries.push({accountId: c_accountid, query: query, color: getColor(i)}) 
                }                
            }
    
            console.log("nrqlQueries",nrqlQueries)
    
        let promises=nrqlQueries.map((q)=>{return NrqlQuery.query({accountIds: [q.accountId], query: q.query,formatTypeenum: NrqlQuery.FORMAT_TYPE.CHART})})
        let data
        
    
        try {
            data = await Promise.all(promises)
            if (data[0].error != null){
               console.log(data[0].error.message)
              setGlobalError(data[0].error.message)
            }
        } catch (e){
            console.log(e)
        }
    
    
       // name the queries and update the colours
       let count = 1
       data.forEach(el => {
           if (count != 1){
               let c_name = data[0].data[0].metadata.name
               el.data[0].metadata.name = data[0].data[0].metadata.name+(count-1)
               el.data[0].metadata.color = getColor(count-2)
               el.data[0].data.forEach(c_array => {
                   for( let item in c_array){
                       if (item == c_name){
                           let item_val = c_array[item]
                           delete c_array[item]
                           item = data[0].data[0].metadata.name+(count-1)
                           c_array[item]=item_val
                       }
                   }
               })
              
           }
           count ++
       })
    
        calculatedata(data)
        setQueryResults(data)
    }


    useEffect(async () => {   
        dataLoader()   
            let refreshratems = (conf_refreshrate === null || conf_refreshrate === "null") ? null : parseInt(conf_refreshrate)*1000

            if(refreshratems === null ) {
                if (windowsizeMoment.asMilliseconds() <= 60000) { // 1 minute or less -> refresh every 10 seconds
                    refreshratems = 10*1000 
                } else if (windowsizeMoment.asMilliseconds() <= 300000 ) { //1 minute to 5 minutes -> refresh every 30 seconds
                    refreshratems = 30*1000 
                } else if (windowsizeMoment.asMilliseconds() <= 3600000 ) { // 5 minutes to 60 minutes -> refresh every 1 minute 
                    refreshratems = 60*1000 
                } else { // over 60 minutes -> refresh every 5 minutes
                    refreshratems = 60*5*1000
                } 

            }
            
            if(refreshratems>0) {
                console.log("Will refresh the data again in ",refreshratems);
                setInterval(() => {dataLoader();}, refreshratems);
            }
        


        return () => clearInterval(interval);            
     },{...props});

    
     if (globalError != undefined){
        return <div className="EmptyState">
        <div className="loader">ERROR: {globalError}</div>
        </div>

    } else if(queryResults) {
        let seriesAlignment = !conf_alignment || conf_alignment =="" ? "start" : conf_alignment
        const determineComparisonPoint = (r) => {
            let comparisonPoint
            switch(seriesAlignment) {
                case "middle": {
                    let midpoint = parseInt((r.data[0].data.length / 2)) - 1
                    comparisonPoint = comparisonPoint = r.data[0].data[ midpoint].x
                    break;                
                }
                case "end": {
                    comparisonPoint = r.data[0].data[r.data[0].data.length-1].x
                    break;           
                }
                default:{
                    comparisonPoint = r.data[0].data[0].x
                }
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

        queryResults.forEach((r)=>{
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

        let vizchartData=[]
        let exportchartData=[]
        let linechartdata = []
        let arechartdata = []

        queryResults.forEach(r=>{ if(r.data && r.data[0] && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea" && r.data[0].metadata.name != "clippedarea") {exportchartData.push(r.data[0])}}) 
        queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name != "min" && r.data[0].metadata.name != "max" && r.data[0].metadata.name != "trimmedmin" && r.data[0].metadata.name != "trimmedmax" && r.data[0].metadata.name != "avg" && r.data[0].metadata.name != "trimmedarea" && r.data[0].metadata.name != "minmaxarea" && r.data[0].metadata.name != "clippedarea" && r.data[0].metadata.name != "clippedmin" && r.data[0].metadata.name != "clippedmax") ){vizchartData.push(r.data[0])}}) 
        

        if( avgbol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "avg") ){linechartdata.push(r.data[0])}})
            
        }
        if( conf_trimmedareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "trimmedarea") ){arechartdata.push(r.data[0])}})
        }
        
        if( conf_minmaxareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "minmaxarea") ){arechartdata.push(r.data[0])}})
        }

        if( conf_clippedareabol == true ) {
            queryResults.forEach(r=>{ if(r.data && r.data[0] && (r.data[0].metadata.name == "clippedarea") ){arechartdata.push(r.data[0])}})
        }
        
        if (conf_hideoriginaldata === true ) {
            vizchartData=[vizchartData[0]]
        }

        vizchartData[0].metadata.color=getColor('primary');


        //Hide future data
        let referencePoint=null;
        let nowTime =  Date.now()
        vizchartData[0].data.forEach((d,idx)=>{
            if(d.begin_time > nowTime || d.end_time > nowTime) {
                d.y = null
                if(referencePoint==null && idx > 0) {
                    referencePoint=idx-1
                }
            }
            
        })

        //Chart configuration options
        let yLabel=null
        let LeftMargin = 0
        if(conf_yaxislabel !== "" & conf_yaxislabel!== null) {
            LeftMargin = 20
            yLabel = { value: conf_yaxislabel, angle: -90, position: 'insideLeft', style: {fontSize: '0.9rem',fontWeight: 'bold',  fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'}}
        }

        let xLabel={value: "Time zone: "+conf_timezone, offset: 0, angle: 0, position: 'insideBottomRight', style: {fontSize: '0.6rem',fontWeight: 'bold',  fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'}}

        // Y axis - supports recharts somain syntax: https://recharts.org/en-US/api/YAxis#domain
        let yAxisDomain=['auto','auto']
        if(conf_yaxismax !== "" && conf_yaxismax!= null) {
            let val = parseInt(conf_yaxismax)
             yAxisDomain[1]=isNaN(val) ? conf_yaxismax : val
        }
        if(conf_yaxismin !== "" && conf_yaxismin!= null) {
            let val = parseInt(conf_yaxismin)
            yAxisDomain[0]=isNaN(val) ? conf_yaxismin : val
        }


        //Reference areas and lines
        let referenceAreas=[], referenceLines=[]
        if(conf_referenceareas && conf_referenceareas.length > 0) {
            conf_referenceareas.forEach((ref)=>{
                if(ref.conf_refType !== null && ((ref.conf_refY1!==null & ref.conf_refY1!=="") || (ref.conf_refY2!==null & ref.conf_refY2!=="")) ) {

                    let y1=ref.conf_refY1 ===  null || ref.conf_refY1==="" ? null : parseInt(ref.conf_refY1);
                    let y2=ref.conf_refY2 ===  null || ref.conf_refY2==="" ? null : parseInt(ref.conf_refY2);
                    let color=ref.conf_refColor ===  null || ref.conf_refColor==="" ? "#33333322" : ref.conf_refColor;

                    let labelColor="#666666";
                    try {labelColor=chroma(color).alpha(1).darken(2).hex();} catch {}
                    
                    let label=ref.conf_refName === null || ref.conf_refName ==="" ? null : {fill: labelColor, value: ref.conf_refName, position: 'insideTopLeft'}
                    if(ref.conf_refType=='area') { 
                        referenceAreas.push(<ReferenceArea y1={y1} y2={y2}  fillOpacity={1} fill={color} label={label} />)
                    }
                    if(ref.conf_refType=='line') {
                        referenceLines.push(<ReferenceLine y={y1} label={label} stroke={color} />)
                    }

                }

            })
        }

        //grid
        let chartGrid=null;
        if(grp_display.conf_gridbol!==null && grp_display.conf_gridbol===true) {
            chartGrid=<CartesianGrid  strokeDasharray="3 3" /> 
        }


        //Line chart options
        let showDots=false;
        if(conf_showdots!=="" && conf_showdots!==null) {
            showDots = conf_showdots;
        }

        let refPoint= (referencePoint == null) ? null : <ReferenceDot fill={getColor('primary')}  x={vizchartData[0].data[referencePoint].x} y={vizchartData[0].data[referencePoint].y} isFront={true}/>;
        let outTable= <>
            <CSVLink filename="QueryData.csv" data={exportToCsv(exportchartData)}>Download data as CSV</CSVLink>
        </>
        return <AutoSizer>
            {({ width, height }) => (<div style={{ height: height, width: width }}>
            <ComposedChart width={width} height={height} margin={{top: 10, right: 50, bottom: 30, left: LeftMargin}}>
          {chartGrid}
          <XAxis tickFormatter={(x)=>{return convertTimestampToDate(x,'xtick',windowsizeMoment.asMilliseconds());}} 
                label={xLabel}
                dataKey="x"  
                type="category" 
                allowDuplicatedCategory={false} 
                interval="equidistantPreserveStart"  
                style={{
                    fontSize: '0.8rem',
                    fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'
                }}/>
          <YAxis 
            dataKey="y" 
            type="number" 
            interval="equidistantPreserveStart" 
            domain={yAxisDomain}
            allowDataOverflow={true} 
            label={yLabel} 
            style={{
                    fontSize: '0.8rem',
                    fontFamily: '"Inter", "Segoe UI", "Tahoma", sans-serif'
                }}
            />
          <Tooltip labelFormatter={(value)=>{return convertTimestampToDate(value,'tooltip',windowsizeMoment.asMilliseconds());}} />
          <Legend />
          {referenceAreas}
          {referenceLines}
          {linechartdata.map((s) => (<Line type="linear" dot={false} stroke={s.metadata.color} strokeWidth={5} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>))}   
          {arechartdata.map((s) => (<Area type="monotone" fill={s.metadata.color} dataKey="y" legendType='none' data={s.data}  name="" strokeWidth={0} key={s.metadata.name}/>))}
          {vizchartData.map((s) => {return <Line type="linear" dot={showDots} stroke={s.metadata.color} strokeWidth={2} dataKey="y" data={s.data} name={s.metadata.name} key={s.metadata.name}/>})}
          {refPoint}
        </ComposedChart>
        <Grid>
            <GridItem columnSpan={12}>
            {outTable}            </GridItem>
        </Grid>
          </div>
        )}
      </AutoSizer>
    } else {
        return <div className="EmptyState">
                <div className="loader"><Spinner inline/> Loading and aligning data...</div>
            </div>
    }
  }
  
export default AlignedTimeseries;
