import React, { useEffect, useState } from "react";
import { isRouteErrorResponse, useParams } from "react-router-dom";
import API from "../../utils/axios";
import "./infovis-panel.styles.scss";
import PlusIcon from '@rsuite/icons/Plus';
import CloseIcon from '@rsuite/icons/Close';
import { Modal, Button, ButtonToolbar, Placeholder, IconButton, Checkbox } from 'rsuite';
import { XRGetFieldsAPI, XRGetCSVAPI, XRGetJSONAPI, XRGetAPIAPI, XRGetDataMaxAPI, XRGetDataMinAPI } from "../api";
import { DXRSpecToData, DataToDXRSpec } from "../XRDXRParser";
import parse from "html-react-parser";
import { _3d } from 'd3-3d';
// import * as _3d from 'd3-3d';
// import { _3d } from "https://unpkg.com/d3-3d/build/d3-3d.js";
// import { _3d } from "https://unpkg.com/d3-3d/build/d3-3d.min.js";
import * as d3 from 'd3';
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// import * as d3 from "https://d3js.org/d3.v4.min.js";
import ReactDOM from 'react-dom'
import { VegaLite } from 'react-vega'
import { textSocket, currentEditor } from "../rete";
import { createRoot } from 'react-dom/client'
import { useRootClose } from "rsuite/esm/utils";
import { CompositeMarkNormalizer } from "vega-lite/build/src/compositemark/base";
import { CONTINUOUS_DOMAIN_SCALES } from "vega-lite/build/src/scale";
// import {legend} from "@d3/color-legend"



var markTypes = ['cube', 'sphere','bar','cone','arrow','pinetree','none'];

var channelTypes = ['x', 'y','z','size','color','opacity','height','width','yoffsetpct'];

var typeTypes = ['quantitative', 'nominal','ordinal','coordinate'];

var file_json;
var mx, my, mouseX, mouseY;
var svg, color, lins_axis;
var key = function(d){ return d.id; }
var grid3d, point3d, cubes3d, cubesLegend3d, yScale3d, xScale3d, zScale3d;
var keys;
var beta = 0, alpha = 0;
var startAngle = Math.PI/4;
// var scatter = [], cubesData = [], xLine = [], yLine = [], zLine = [], xGrid = [];
var items_arr = [], items_legend = [], xLine = [], yLine = [], zLine = [], xGrid = [];
var xName=[], yName=[], zName=[];
var range_val = 5;
// var ranges_xz = [-range_val, range_val];
// var ranges_y = [0, -range_val*2];
// var default_size = 3;
var default_size_mark = 3;
var default_size_legend = 7;
var sizes = [1, 10];
var num_sizes = 10;
var stride_size = 1;
var opacity = [0.25, 1.0];
var default_color = "#2E5C68";
var domains = {};
var half_size_cubes = 0.1;
var ratio_cube = 0.02;
var num_ticks = 5;
var lins;
var strides = {};

// var ranges = {
//   'x': [-range_val, range_val],
//   'y': [0, -range_val*2],
//   'z': [-range_val, range_val]
// };

var ranges = {
  'x': [],
  'y': [],
  'z': []
};

var color_schemes = {
  'ramp': [ "#fee0d2", "#de2d26" ],
  'tableau10': [ "#4c78a8", "#f58518", "#e45756", "#72b7b2", "#54a24b", "#eeca3b", "#b279a2", "#ff9da6", "#9d755d", "#bab0ac" ],

  'blues': [ "#f7fbff", "#08306b"],
  'tableau20': [ "#9edae5", "#17becf", "#dbdb8d", "#bcbd22", "#c7c7c7", "#7f7f7f", "#f7b6d2", "#e377c2", "#c49c94", "#8c564b", "#c5b0d5", "#9467bd", "#ff9896", "#d62728", "#98df8a", "#2ca02c", "#ffbb78", "#ff7f0e", "#aec7e8", "#1f77b4<" ],
  'viridis': [ "#440154", "#20908C", "#FDE724"]
};


const InfoVis = (props) => {
  // console.log(props);

  var value = props;



  var [mark,setMark] = useState(value['mark'][0]);
  var [refresh,setRefresh] = useState(0);
  var [mesh,setMesh] = useState(value['mesh'][0]);

  var [spec,setSpec] = useState({});
  var [spec_text,setSpec_text] = useState('');
  var [spec_vega,setSpecvega] = useState({});
  var [loaded_data,setLoadedData] = useState({});
  var [markList,setMarkList]=useState('<option>Select mark type...</option>');

  // var [g_svg,setGSVG] = useState(<g></g>);
  var [div_vega,setDivVega] = useState(<g></g>);
  // var [div_3d,setDiv3D] = useState(<g></g>);
  // var [div_3d,setDiv3D] = useState({});
  var [g_grid,setGrid] = useState(<g></g>);
  var [g_items,setItems] = useState(<g></g>);
  var [g_items_legend,setItemsLegend] = useState(<g></g>);
  var [g_scale,setScale] = useState(<g></g>);
  var [g_text_y,setTextY] = useState(<g></g>);
  var [g_text_x,setTextX] = useState(<g></g>);
  var [g_text_z,setTextZ] = useState(<g></g>);
  var [g_name_y,setNameY] = useState(<g></g>);
  var [g_name_x,setNameX] = useState(<g></g>);
  var [g_name_z,setNameZ] = useState(<g></g>);
  var [dots,setDots] = useState(<g></g>);
  var [labels,setLabels] = useState(<g></g>);
  var [gradient,setGradient] = useState(<g></g>);
  // var [legend_color,setLegendColor] = useState(<g></g>);
  var [labels_color,setLabelsColor] = useState(<g></g>);
  var [marks_size, setMarksSize] = useState(<g></g>);
  var [labels_size, setLabelsSize] = useState(<g></g>);
  var [marks_opacity, setMarksOpacity] = useState(<g></g>);
  var [labels_opacity, setLabelsOpacity] = useState(<g></g>);

  useEffect(() => {
    generateMarkList();
    generateFieldList();
    loadData();
    generateDXRSpec();
    // draw3DPlot();
    
    return () =>{
      if(value['comp']!==null){
        value['comp']();
      }
    }
  }, []);

  // console.log(value);

  async function onChange(v){
    spec =  await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
    setSpec(spec);
    spec_text = JSON.stringify(spec,null,2);
    setSpec_text(spec_text);
    await loadData();
  }

  async function applyTextToSpec(){
    var img = document.querySelector("#vis-spec-txt");
    if(img===null)return;
    spec = JSON.parse(img.value);
    DXRSpecToData(spec,value['path'],value['mark'],value['mesh'],value['encoding_list']);
    setSpec(spec);
    spec_text = JSON.stringify(spec,null,2);
    setSpec_text(spec_text);
    await loadData();

  }

  async function handleTextChange(e){
    spec_text = e.target.value;
    setSpec_text(spec_text);
  }

  async function generateDXRSpec(){
    spec = await DataToDXRSpec(value['path'],value['mark'],value['mesh'],value['encoding_list']);
    setSpec(spec);

    spec_text = JSON.stringify(spec,null,2);
    setSpec_text(spec_text);

    

//    spec["data"]["url"] ==="/workspace/xrops/users/test_data/iris.csv"
    // spec["data"]["value"]= 
  } 

  async function generateFieldList(){  
    var types = await XRGetFieldsAPI(value['path']);
    // console.log('fields: ');
    // console.log(types);
    if(types!==undefined){
      value['fieldTypes'].splice(0, value['fieldTypes'].length);
      for(let i = 0; i < types.length ; i++){
        value['fieldTypes'].push(types[i]);
      }
      onChange({path: value['path'],
        mark: value['mark'],
        mesh: value['mesh'],
        fieldTypes: types,
        encoding_list: value['encoding_list']});
      setRefresh(refresh + 1);  
    }
  }
  async function generateMarkList(){  
    var newList = markTypes.map((x) => `<option>${x}</option>`);
    newList.splice(0,0,["<option>Select mark type...</option>"]);
    markList = newList.join("\n");
    setRefresh(refresh + 1);  
    setMarkList(markList);
}

  async function addNewEncoding(){  
    value['encoding_list'].push({channel: "x", data_field: "x", data_type: "quantitative"});
    onChange({path: value['path'],
            mark: value['mark'],
            mesh: value['mesh'],
            fieldTypes: value['fieldTypes'],
            encoding_list: value['encoding_list']});

    setRefresh(refresh + 1);  
  }
  async function removeEncoding(ind){  
    value['encoding_list'].splice(ind,1)
    onChange({path: value['path'],
            mark: value['mark'],
            mesh: value['mesh'],
            fieldTypes: value['fieldTypes'],
            encoding_list: value['encoding_list']});

    setRefresh(refresh + 1);  
  }

  function csvToJSON(csv_arr){

    const jsonArray = [];

    var header = [];
    for (var i=0; i<csv_arr[0].length; i++)
    {
        header[i] = csv_arr[0][i];
    }

    for(let i = 1; i < csv_arr.length; i++){
  
        let obj = {};

        for(var j=0; j < header.length; j++){
          var cur_value = csv_arr[i][j];
          var cur_value_num = Number(cur_value);

          if (isNaN(cur_value_num))
            obj[header[j]] = cur_value;
          else
            obj[header[j]] = cur_value_num;
        }

        jsonArray.push(obj);
    }
    
    return jsonArray;
  }

  function posPointX(d){
      return d.projected.x;
  }

  function posPointY(d){
      return d.projected.y;
  }

  function d3_rgbString (value) {
  return d3.rgb(value >> 16, value >> 8 & 0xff, value & 0xff);
  }

  function dragStart(event){
      // mx = d3.event.x;
      // my = d3.event.y;
      mx = event.x;
      my = event.y;
  }

  function dragged(event){
      mouseX = mouseX || 0;
      mouseY = mouseY || 0;
      // beta   = (d3.event.x - mx + mouseX) * Math.PI / 230 ;
      // alpha  = (d3.event.y - my + mouseY) * Math.PI / 230  * (-1);
      beta   = (event.x - mx + mouseX) * Math.PI / 230 ;
      alpha  = (event.y - my + mouseY) * Math.PI / 230  * (-1);
      
      var grid_3d = grid3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(xGrid);
      // var grid_3d = grid3d.rotateY(startAngle).rotateX(startAngle)(xGrid);
      // var items_3d = point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(items_arr);
      var yscale_3d = yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([yLine]);
      var xscale_3d = xScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([xLine]);
      var zscale_3d = zScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([zLine]);
      var yname_3d = yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([yName]);
      var xname_3d = xScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([xName]);
      var zname_3d = zScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([zName]);

      var items_3d;
      var items_legend_3d = 0;

      if (spec_vega['mark'] === 'circle')
        items_3d = point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(items_arr);
      else if (spec_vega['mark'] === 'square')
      {
        items_3d = cubes3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(items_arr);
        
        if ('size' in spec_vega['encoding'])
        {
          items_legend_3d = cubesLegend3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(items_legend);
        }
      }
   
        
      
      // processData(grid_3d, items_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d);
      processData(grid_3d, items_3d, items_legend_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d);
  }

  function dragEnd(event){
      // mouseX = d3.event.x - mx + mouseX;
      // mouseY = d3.event.y - my + mouseY;
      mouseX = event.x - mx + mouseX;
      mouseY = event.y - my + mouseY;
  }

  function ColorToHex(color) {
    var hexadecimal = color.toString(16);
    return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
  }

  function ConvertRGBtoHex(rgb_arr) {
    // return "#" + ColorToHex(red) + ColorToHex(green) + ColorToHex(blue);
    return "#" + ColorToHex(rgb_arr[0]) + ColorToHex(rgb_arr[1]) + ColorToHex(rgb_arr[2]);
  }

  var count_rgb = 0;

  function getRGB(rgb)
  {
    // var rgb_str = rgb.substring(4, rgb.length-1)
    //   .replace(/ /g, '')
    //   .split(',');

    

    if (!(rgb === undefined ))
    {
      var rgb_str = rgb.replace(/[^\d,]/g, '').split(',');

      
      var rgb_num = [];
      for (var i=0; i<rgb_str.length; i++)
      {
        rgb_num[i] = parseInt(rgb_str[i]);
      }

      // console.log("getRGB");
      // console.log(rgb_num);

      // count_rgb++;
      // console.log("count_rgb");
      // console.log(count_rgb);
      // console.log(loaded_data['table'].length);

      return rgb_num;

      

    }
    else
    {
      return [0, 0, 0];
    }
  }
  

  // function processData(grid_3d, point_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d){
  // function processData(grid_3d, items_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d){
  function processData(grid_3d, items_3d, items_legend_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d){
    var xGrid_svg = svg.selectAll('path.grid').data(grid_3d, key);

    var xGrid_svg_return = xGrid_svg
      .enter()
      .append('path')
      .attr('class', '_3d grid')
      .merge(xGrid_svg)
      .attr('stroke', 'black')
      .attr('stroke-width', 0.3)
      .attr('fill', function(d){ return d.ccw ? 'lightgrey' : '#717171'; })
      .attr('fill-opacity', 0.9)
      .attr('d', grid3d.draw);

      // console.log("xGrid_svg_return");
      // console.log(xGrid_svg_return._groups[0]);
    
    // xGrid_svg.exit().remove();

    var xGrid_arr = xGrid_svg_return._groups[0];
    
    // console.log("xGrid_arr");
    // console.log(xGrid_arr);
    // console.log(xGrid_arr[0]);
    // console.log(xGrid_arr[1]);

    // var g_svg = document.createElement('g');

    var d_arr = [];

    for (var i=0; i<xGrid_arr.length; i++)
    {  
      d_arr[i] = xGrid_arr[i].getAttribute("d");    
    }

    g_grid = d_arr.map((val) => (
      // <path class="_3d grid" stroke="black" stroke-width="0.3" fill="lightgrey" fill-opacity="0.9" d={val}></path>
      <path className="_3d grid" stroke="black" strokeWidth="0.3" fill="lightgrey" fillOpacity="0.9" d={val}></path>
    ));

    // setGrid(g_grid);



    if (spec_vega['mark'] === 'circle')
    {
      var points = svg.selectAll('circle').data(items_3d, key);

      var points_return;

      if ("color" in spec_vega["encoding"])
      {
        if (spec_vega["encoding"]["color"]["type"] === "nominal")
        {
          points_return = points
            .enter()
            .append('circle')
            .attr('class', '_3d')
            .attr('opacity', 0)
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            .merge(points)
            // .transition().duration(tt)
            // .attr('r', 3)
            .attr('r', function(d){ return d.size; })
            // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(3); })
            // .attr('fill', function(d){ return color(d.id); })
            // .attr('opacity', 1)
            .attr('opacity', function(d){ return d.opacity; })
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(3); })
            .attr('stroke', function(d){ return d3.color(ConvertRGBtoHex(getRGB(d.color))).darker(3); })
            .attr('fill', function(d){ return color(d.id); });
        }
        else if (spec_vega["encoding"]["color"]["type"] === "quantitative")
        {
          points_return = points
            .enter()
            .append('circle')
            .attr('class', '_3d')
            .attr('opacity', 0)
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            .merge(points)
            // .transition().duration(tt)
            // .attr('r', 3)
            .attr('r', function(d){ return d.size; })
            // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(3); })
            // .attr('fill', function(d){ return color(d.id); })
            // .attr('opacity', 1)
            .attr('opacity', function(d){ return d.opacity; })
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            // .attr('stroke', function(d){ return d3.color(d.color).darker(3); })
            .attr('stroke', function(d){ return d3.color(ConvertRGBtoHex(getRGB(d.color))).darker(3); })
            .attr('fill', function(d){ return d.color; });
        }
      }
      else
      {
        points_return = points
          .enter()
          .append('circle')
          .attr('class', '_3d')
          .attr('opacity', 0)
          .attr('cx', posPointX)
          .attr('cy', posPointY)
          .merge(points)
          // .transition().duration(tt)
          // .attr('r', 3)
          .attr('r', function(d){ return d.size; })
          // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(3); })
          // .attr('fill', function(d){ return color(d.id); })
          // .attr('opacity', 1)
          .attr('opacity', function(d){ return d.opacity; })
          .attr('cx', posPointX)
          .attr('cy', posPointY)
          .attr('stroke', function(d){ return d3.color(default_color).darker(3); })
          .attr('fill', function(d){ return default_color; });
      }

      
      var points_arr = points_return._groups[0];

      // console.log("points_arr");
      // console.log(points_arr);
      // console.log(points_arr[0]);

      var circles_arr = [];

      for (var i=0; i<points_arr.length; i++)
      {  
        
        // if (Number.isNaN(points_arr[i].getAttribute("cx")) && Number.isNaN(points_arr[i].getAttribute("cy")))
        if (points_arr[i].getAttribute("cx")==="NaN" && points_arr[i].getAttribute("cy")==="NaN")
        {
          // console.log("corner");
          continue;
        }

        var cur_obj = {};
        cur_obj["cx"] = points_arr[i].getAttribute("cx");   
        cur_obj["cy"] = points_arr[i].getAttribute("cy");  
        cur_obj["stroke"] = points_arr[i].getAttribute("stroke");
        cur_obj["fill"] = points_arr[i].getAttribute("fill");    
        cur_obj["r"] = points_arr[i].getAttribute("r");
        cur_obj["opacity"] = points_arr[i].getAttribute("opacity");
        circles_arr.push(cur_obj);
      }

      


      console.log("circles_arr");
      console.log(circles_arr);


      g_items = circles_arr.map((val) => (
        <circle className="_3d" opacity={val.opacity} cx={val.cx} cy={val.cy} r={val.r} stroke={val.stroke} fill={val.fill}></circle>
      ));
    }
    else if (spec_vega['mark'] === 'square')
    {
      var cubes = svg.selectAll('g.cube').data(items_3d, function(d){ return d.id });

      var ce, faces_return;

      

      if ("color" in spec_vega["encoding"])
      {
        if (spec_vega["encoding"]["color"]["type"] === "nominal")
        {
          ce = cubes
            .enter()
            .append('g')
            .attr('class', 'cube')
            .attr('fill', function(d){ return color(d.id); })
            // .attr('stroke', function(d){ return color(d.id); })
            .attr('stroke', function(d){ return d3.color(color(d.id)).darker(2); })
            // .attr('stroke', function(d){ return d3.color(ConvertRGBtoHex(getRGB(d.color))).darker(3); })
            .attr('fill-opacity', function(d){ return d.opacity; })
            .merge(cubes);
            
          // ce.sort(cubes3d.sort);

          // console.log("ce");
          // console.log(ce);
          // console.log(ce._groups[0]);
          // console.log(ce._groups[0][0]);

          var faces = cubes.merge(ce).selectAll('path.face').data(function(d){ return d.faces; }, function(d){ return d.face; });

          faces_return = faces.enter()
              .append('path')
              .attr('class', 'face')
              // .attr('fill-opacity', 0.95)
              // .attr('fill-opacity', function(d){ return d.opacity; })
              .classed('_3d', true)
              .merge(faces)
              // .transition().duration(tt)
              .attr('d', cubes3d.draw);
          
          // console.log("faces_return");
          // console.log(faces_return);
          // console.log(faces_return._groups[0]);
          // console.log(faces_return._groups[0][0]);

                  
        }
        else if (spec_vega["encoding"]["color"]["type"] === "quantitative")
        {  
          ce = cubes
            .enter()
            .append('g')
            .attr('class', 'cube')
            // .attr('fill', function(d){ return color(d.id); })
            // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(2); })
            .attr('stroke', function(d){ return d3.color(ConvertRGBtoHex(getRGB(d.color))).darker(3); })
            // .attr('stroke', function(d){ return ConvertRGBtoHex(getRGB(d.color)); })
            .attr('fill', function(d){ return d.color; })
            .attr('fill-opacity', function(d){ return d.opacity; })
            .merge(cubes);
            // .sort(cubes3d.sort);

          // ce.sort(cubes3d.sort);

          // console.log("ce");
          // console.log(ce);
          // console.log(ce._groups[0]);
          // console.log(ce._groups[0][0]);

          var faces = cubes.merge(ce).selectAll('path.face').data(function(d){ return d.faces; }, function(d){ return d.face; });

          faces_return = faces.enter()
              .append('path')
              .attr('class', 'face')
              // .attr('fill-opacity', 0.95)
              // .attr('fill-opacity', function(d){ return d.opacity; })
              .classed('_3d', true)
              .merge(faces)
              // .transition().duration(tt)
              .attr('d', cubes3d.draw);
          
          // console.log("faces_return");
          // console.log(faces_return);
          // console.log(faces_return._groups[0]);
          // console.log(faces_return._groups[0][0]);
        }
      }
      else
      {
        ce = cubes
            .enter()
            .append('g')
            .attr('class', 'cube')
            // .attr('fill', function(d){ return color(d.id); })
            // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(2); })
            .attr('stroke', function(d){ return d3.color(default_color).darker(3); })
            .attr('fill', function(d){ return default_color; })
            .attr('fill-opacity', function(d){ return d.opacity; })
            .merge(cubes);
            // .sort(cubes3d.sort);

          ce.sort(cubes3d.sort);
          // cubes.sort(cubes3d.sort);

          // console.log("ce");
          // console.log(ce);
          // console.log(ce._groups[0]);
          // console.log(ce._groups[0][0]);

          var faces = cubes.merge(ce).selectAll('path.face').data(function(d){ return d.faces; }, function(d){ return d.face; });

          faces_return = faces.enter()
              .append('path')
              .attr('class', 'face')
              // .attr('fill-opacity', 0.95)
              // .attr('fill-opacity', function(d){ return d.opacity; })
              .classed('_3d', true)
              .merge(faces)
              // .transition().duration(tt)
              .attr('d', cubes3d.draw);
          
          // console.log("faces_return");
          // console.log(faces_return);
          // console.log(faces_return._groups[0]);
          // console.log(faces_return._groups[0][0]);
      }

      ce.selectAll('._3d').sort(_3d().sort);


      
      var ce_arr = ce._groups[0];

      console.log("ce_arr");
      // console.log(ce_arr);
      console.log(ce_arr[0]);

      // var faces_arr = faces_return._groups[0];
      // // var faces_arr = faces_return;

      // console.log("faces_arr");
      // console.log(faces_arr);
      // console.log(faces_arr[0]);

      console.log("ce_arr[0].chiledren");
      console.log(ce_arr[0].childNodes);
      console.log(ce_arr[0].childNodes[0]);

      var cubes_arr = [];

      for (var i=0; i<ce_arr.length; i++)
      {  
        var cur_obj = {};

        cur_obj["stroke"] = ce_arr[i].getAttribute("stroke");
        cur_obj["fill"] = ce_arr[i].getAttribute("fill");  
        cur_obj["fillOpacity"] = ce_arr[i].getAttribute("fill-opacity");

        // if (ce_arr[i] === undefined)

        var children = ce_arr[i].childNodes;
        for (var j=0; j<6; j++)
        {
          // var cur_child = children[j];

          cur_obj['d'+j] = children[j].getAttribute("d"); 
        }
        
        cubes_arr.push(cur_obj);
      } 

      console.log("cubes_arr");
      console.log(cubes_arr);

      g_items = cubes_arr.map((val) => (
        <g>
          <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d0}></path>
          <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d1}></path>
          <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d2}></path>
          <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d3}></path>
          <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d4}></path>
          <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d5}></path>
        </g>
      ));

      

      // g_items = cubes_arr.map((val) => (
      //   <g>
      //     <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} fill={val.fill} d={val.d0}></path>
      //     <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} fill={val.fill} d={val.d1}></path>
      //     <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} fill={val.fill} d={val.d2}></path>
      //     <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} fill={val.fill} d={val.d3}></path>
      //     <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} fill={val.fill} d={val.d4}></path>
      //     <path className="face _3d" fillOpacity={val.fillOpacity} stroke={val.stroke} fill={val.fill} d={val.d5}></path>
      //   </g>
      // ));

    }
   

   
    

    var yScale = svg.selectAll('path.yScale').data(yscale_3d);

    var yScale_return = yScale
      .enter()
      .append('path')
      .attr('class', '_3d yScale')
      .merge(yScale)
      .attr('stroke', 'black')
      .attr('stroke-width', .5)
      .attr('d', yScale3d.draw);

    var sacle_arr = yScale_return._groups[0];

    console.log("sacle_arr");
    console.log(sacle_arr[0]);

    
    var d_arr_scale = [];

    for (var i=0; i<sacle_arr.length; i++)
    {  
      d_arr_scale[i] = sacle_arr[i].getAttribute("d");    
    }

    g_scale = d_arr_scale.map((val) => (
      <path className="_3d yScale" stroke="black" strokeWidth="0.5" d={val}></path>
    ));

    // var yText = svg.selectAll('text.yText').data(yscale_3d[0].splice(1));
    // var yText = svg.selectAll('text.yText').data(yscale_3d[0]);

    var yscale_3d_slice = yscale_3d[0].slice(1, range_val*2+2);
    var yText = svg.selectAll('text.yText').data(yscale_3d_slice);

    // console.log("yscale_3d_splice");
    // console.log(yscale_3d_splice);

    console.log("yscale_3d");
    console.log(yscale_3d[0]);

 

    var yText_return = yText
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(yText)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; })
            .text(function(d){ return d[1] <= 0 ? d[1] : ''; });
    
    var text_arr = yText_return._groups[0];

    console.log("text_arr");
    console.log(text_arr);
    // console.log(text_arr[0].textContent);
    console.log(text_arr.length);

 

    // <text class="_3d yText" dx=".3em" x="257" y="537">0</text>

    var text_arr2 = [];

    for (var i=0; i<text_arr.length; i++)
    // for (var i=0; i<range_val*2+1; i++)
    {  
      // circles_arr[i]
      //  = points_arr[i].getAttribute("d");    
      var cur_obj = {};
      cur_obj["x"] = text_arr[i].getAttribute("x");   
      cur_obj["y"] = text_arr[i].getAttribute("y"); 
      
      var cur_value = Number(text_arr[i].textContent); 
      
      if (spec_vega["encoding"]["y"]["type"] === "quantitative")
      {
        cur_obj["textContent"] = Math.round(lins_axis["y"](cur_value)*10)/10;

      }
      else if (spec_vega["encoding"]["y"]["type"] === "nominal" || spec_vega["encoding"]["y"]["type"] === "ordinal")
      {
        var id = ranges['y'].indexOf(cur_value);

        cur_obj["textContent"] = domains['y'][id];
      }

      // cur_obj["textContent"] = text_arr[i].textContent; 

      text_arr2.push(cur_obj);
    }

    console.log("text_arr2");
    console.log(text_arr2);

    g_text_y = text_arr2.map((val) => (

      // <text class="_3d yText" dx=".3em" x={val.x} y={val.y}>{val.textContent}</text>
      // <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{Math.round(lins_axis["y"](-val.textContent)*10)/10}</text>
      // <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{Math.round(lins_axis["y"](val.textContent)*10)/10}</text>
      <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{val.textContent}</text>
    ));


    var xText = svg.selectAll('text.yText').data(xscale_3d[0]);

    console.log("xscale_3d");
    console.log(xscale_3d[0]);

    var xText_return = xText
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(xText)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; })
            // .text(function(d){ return d[0] <= 0 ? d[0] : ''; });
            .text(function(d){ return d[0]; });
    
    var text_arr = xText_return._groups[0];

    // console.log("text_arr");
    // console.log(text_arr[0]);
    // console.log(text_arr[0].textContent);

    // <text class="_3d yText" dx=".3em" x="257" y="537">0</text>

    var text_arr2 = [];

    for (var i=0; i<text_arr.length; i++)
    {  
      // circles_arr[i]
      //  = points_arr[i].getAttribute("d");    
      var cur_obj = {};
      cur_obj["x"] = text_arr[i].getAttribute("x");   
      cur_obj["y"] = text_arr[i].getAttribute("y");  

      // cur_obj["textContent"] = text_arr[i].textContent; 

      var cur_value = Number(text_arr[i].textContent); 
      
      if (spec_vega["encoding"]["x"]["type"] === "quantitative")
      {
        cur_obj["textContent"] = Math.round(lins_axis["x"](cur_value)*10)/10;

      }
      else if (spec_vega["encoding"]["x"]["type"] === "nominal" || spec_vega["encoding"]["x"]["type"] === "ordinal")
      {
        var id = ranges['x'].indexOf(cur_value);

        cur_obj["textContent"] = domains['x'][id];
      }

      text_arr2.push(cur_obj);
    }

    console.log("text_arr2");
    console.log(text_arr2);

    g_text_x = text_arr2.map((val) => (

      // <text class="_3d yText" dx=".3em" x={val.x} y={val.y}>{val.textContent}</text>
      // <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{Math.round(lins_axis["x"](-val.textContent)*10)/10}</text>
      // <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{Math.round(lins_axis["x"](val.textContent)*10)/10}</text>
      <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{val.textContent}</text>
    ));


    var zText = svg.selectAll('text.yText').data(zscale_3d[0]);

    var zText_return = zText
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(zText)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; })
            // .text(function(d){ return d[2] <= 0 ? d[2] : ''; });
            .text(function(d){ return d[2]; });
    
    var text_arr = zText_return._groups[0];

    console.log("text_arr_z");
    console.log(text_arr[0]);
    console.log(text_arr[0].textContent);

    // <text class="_3d yText" dx=".3em" x="257" y="537">0</text>

    var text_arr2 = [];

    for (var i=0; i<text_arr.length; i++)
    {  
      // circles_arr[i]
      //  = points_arr[i].getAttribute("d");    
      var cur_obj = {};
      cur_obj["x"] = text_arr[i].getAttribute("x");   
      cur_obj["y"] = text_arr[i].getAttribute("y");  

      var cur_value = Number(text_arr[i].textContent); 
      
      if (spec_vega["encoding"]["z"]["type"] === "quantitative")
      {
        cur_obj["textContent"] = Math.round(lins_axis["z"](cur_value)*10)/10;

      }
      else if (spec_vega["encoding"]["z"]["type"] === "nominal" || spec_vega["encoding"]["z"]["type"] === "ordinal")
      {
        var id = ranges['z'].indexOf(cur_value);

        cur_obj["textContent"] = domains['z'][id];
      }
      
      

   
      text_arr2.push(cur_obj);
    }

    console.log("text_arr2");
    console.log(text_arr2);

    g_text_z = text_arr2.map((val) => (

      // <text class="_3d yText" dx=".3em" x={val.x} y={val.y}>{val.textContent}</text>
      // <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{Math.round(lins_axis["z"](-val.textContent)*10)/10}</text>
      // <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{Math.round(lins_axis["z"](val.textContent)*10)/10}</text>
      <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>{val.textContent}</text>
    ));


    var yname = svg.selectAll('text.yText').data(yname_3d[0]);

    // console.log("xscale_3d");
    // console.log(xscale_3d[0]);

    var yname_return = yname
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(yname)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; });
            // .text(function(d){ return d[0] <= 0 ? d[0] : ''; });
            // .text("x");
    
    var name_arr = yname_return._groups[0];

    // console.log("text_arr");
    // console.log(text_arr[0]);
    // console.log(text_arr[0].textContent);

    // <text class="_3d yText" dx=".3em" x="257" y="537">0</text>

    var name_arr2 = [];

    for (var i=0; i<name_arr.length; i++)
    {  
      var cur_obj = {};
      cur_obj["x"] = name_arr[i].getAttribute("x");   
      cur_obj["y"] = name_arr[i].getAttribute("y");  
      name_arr2.push(cur_obj);
    }

    // console.log("text_arr2");
    // console.log(text_arr2);

    g_name_y = name_arr2.map((val) => (

      <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>y</text>
    ));


    var xname = svg.selectAll('text.yText').data(xname_3d[0]);

    // console.log("xscale_3d");
    // console.log(xscale_3d[0]);

    var xname_return = xname
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(xname)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; });
            // .text(function(d){ return d[0] <= 0 ? d[0] : ''; });
            // .text("x");
    
    var name_arr = xname_return._groups[0];

    // console.log("text_arr");
    // console.log(text_arr[0]);
    // console.log(text_arr[0].textContent);

    // <text class="_3d yText" dx=".3em" x="257" y="537">0</text>

    var name_arr2 = [];

    for (var i=0; i<name_arr.length; i++)
    {  
      var cur_obj = {};
      cur_obj["x"] = name_arr[i].getAttribute("x");   
      cur_obj["y"] = name_arr[i].getAttribute("y");  
      name_arr2.push(cur_obj);
    }

    // console.log("text_arr2");
    // console.log(text_arr2);

    g_name_x = name_arr2.map((val) => (

      <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>x</text>
    ));

    var zname = svg.selectAll('text.yText').data(zname_3d[0]);

    // console.log("xscale_3d");
    // console.log(xscale_3d[0]);

    var zname_return = zname
            .enter()
            .append('text')
            .attr('class', '_3d yText')
            .attr('dx', '.3em')
            .merge(zname)
            .each(function(d){
                d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
            })
            .attr('x', function(d){ return d.projected.x; })
            .attr('y', function(d){ return d.projected.y; });
            // .text(function(d){ return d[0] <= 0 ? d[0] : ''; });
            // .text("x");
    
    var name_arr = xname_return._groups[0];

    // console.log("text_arr");
    // console.log(text_arr[0]);
    // console.log(text_arr[0].textContent);

    // <text class="_3d yText" dx=".3em" x="257" y="537">0</text>

    var name_arr2 = [];

    for (var i=0; i<name_arr.length; i++)
    {  
      var cur_obj = {};
      cur_obj["x"] = name_arr[i].getAttribute("x");   
      cur_obj["y"] = name_arr[i].getAttribute("y");  
      name_arr2.push(cur_obj);
    }

    // console.log("text_arr2");
    // console.log(text_arr2);

    g_name_z = name_arr2.map((val) => (

      <text className="_3d yText" dx=".3em" x={val.x} y={val.y}>z</text>
    ));


    if ("color" in spec_vega["encoding"])
    {
      if (spec_vega["encoding"]["color"]["type"] === "nominal")
      {
        gradient = <g></g>;
        setGradient(gradient);
        
        document.getElementById("color_legend").style.display = "none";
        document.getElementById("axisLeg_id").style.display = "none";
        
        var dots_arr = [];

        for (var i=0; i<keys.length; i++)
        {
          var cur_obj = {};
          cur_obj["cy"] = 100 + i*25;
          cur_obj["r"] = default_size_legend;
          cur_obj["fill"] = color(keys[i]);


          cur_obj["y"] = 100 + i*25;
          cur_obj["text"] = keys[i];

          dots_arr.push(cur_obj);
        }

        dots = dots_arr.map((val) => (
          // <circle cx="100" cy={val.cy} r="7" fill={val.fill}></circle>
          <circle cx="100" cy={val.cy} r={default_size_legend} fill={val.fill}></circle>
        ));

        labels = dots_arr.map((val) => (
          // <text x="120" y={val.y} fill={val.fill} text-anchor="left" alignment-baseline="middle">{val.text}</text>
          <text x="120" y={val.y} fill={val.fill} textAnchor="left" alignmentBaseline="middle">{val.text}</text>
        ));
    
        

        setDots(dots);
        setLabels(labels);
        
      }
      else if (spec_vega["encoding"]["color"]["type"] === "quantitative")
      {
        dots = <g></g>;
        labels = <g></g>;

        setDots(dots);
        setLabels(labels);

        var cur_scheme = color_schemes[spec_vega["encoding"]['color']['scale']['scheme']];

        // console.log("domains_color");
        // console.log((domains['color'][domains['color'].length-1] - domains['color'][0]));

        var ticks = [];
        var stride_domain = (domains['color'][domains['color'].length-1] - domains['color'][0]) / (num_ticks-1);
        // var stride_domain = (domains['color'][1] - domains['color'][0]) / (num_ticks-1);
        var stride_offset = 100 / (num_ticks-1);
        var count_ticks = 0;
        var gradient_arr = [];
        // var stop_colors = [];

        console.log("stride_domain");
        console.log(stride_domain);

        for (var i=0; i<num_ticks; i++)
        {
          ticks[i] = domains['color'][0] + stride_domain*i;

          var cur_obj = {};

          cur_obj['offset'] = (stride_offset * i) + '%';
          cur_obj['stopColor'] = lins['color'](ticks[i]);

   
          gradient_arr.push(cur_obj);
          

   
        }

        console.log("ticks");
        console.log(ticks);

        console.log("gradient_arr");
        console.log(gradient_arr);

        // for (var i=domains['color'][0]; i<=domains['color'][1]; i+=stride)
        // {
        //   ticks[count_ticks] = i;
        //   stop_colors[count_ticks] = lins['color'](i);

        //   count_ticks++;
        // }

     
        
        
        gradient = gradient_arr.map((val) => (
          <stop offset={val.offset} stopColor={val.stopColor}></stop>
        ));
        
        //       <stop offset="0%" stopColor="#FAFA6E"></stop>
        //       <stop offset="25%" stopColor="#9AD87D"></stop>
        //       <stop offset="50%" stopColor="#57B085"></stop>
        //       <stop offset="75%" stopColor="#37867E"></stop>
        //       <stop offset="100%" stopColor="#2E5C68"></stop>

        //       dots = dots_arr.map((val) => (
        //         // <circle cx="100" cy={val.cy} r="7" fill={val.fill}></circle>
        //         <circle cx="100" cy={val.cy} r={default_size_legend} fill={val.fill}></circle>
        //       ));

    

        // gradient = <defs>
        //     <linearGradient id="linear-gradient" x1="0%" x2="0%" y1="100%" y2="0%">
        //       <stop offset="0%" stopColor="#FAFA6E"></stop>
        //       <stop offset="25%" stopColor="#9AD87D"></stop>
        //       <stop offset="50%" stopColor="#57B085"></stop>
        //       <stop offset="75%" stopColor="#37867E"></stop>
        //       <stop offset="100%" stopColor="#2E5C68"></stop>
        //     </linearGradient>
        //   </defs>

        // setGradient();
        
        var yLeg = d3.scaleLinear()
          .domain([domains['color'][0], domains['color'][domains['color'].length-1]])
          // .domain(domains['color'])
          .range([250, 100]);
          // .range([100, 250]);



        // var yLeg = d3.scaleLinear()
        //   .domain(domains['color'])
        //   .range([250, 100]);
        //   // .range([100, 250]);


        // var ticks = [];
        // var stride = (domains['color'][1] - domains['color'][0]) / 4;

        // var count_ticks = 0;
        // for (var i=domains['color'][0]; i<=domains['color'][1]; i+=stride)
        // {
        //   ticks[count_ticks] = i;

        //   count_ticks++;
        // }

        // console.log("ticks");
        // console.log(ticks);

        var axisLeg = d3.axisRight(yLeg)
        .tickValues(ticks);
          // .tickValues(domains['color'])
    

          // setLabelsColor(labels_color);
        
        // d3.select('#svg_plot').call(axisLeg);
        d3.select('#axisLeg_id').call(axisLeg);

        
        setGradient(gradient);
        document.getElementById("color_legend").style.display = null;
        document.getElementById("axisLeg_id").style.display = null;   

        // document.getElementById("color_legend").style.display = "none";
        // document.getElementById("axisLeg_id").style.display = "none";
      } 
    }
    else
    {
      dots = <g></g>;
      labels = <g></g>;
      gradient = <g></g>;

      setDots(dots);
      setLabels(labels);
      setGradient(gradient);

      document.getElementById("color_legend").style.display = "none";
      document.getElementById("axisLeg_id").style.display = "none";
    }
    
 

    

    // console.log("dots");
    // console.log(dots);


    

    
    if ("size" in spec_vega["encoding"])
    {
      var el = document.getElementsByClassName("right-panel").item(0);
      var width_svg = el.clientWidth;
      var height_svg = el.clientHeight;
      
      if (spec_vega['mark'] === 'circle')
      {
        g_items_legend = <g></g>;
        
        setItemsLegend(g_items_legend);
        
        var size_arr = [];

        for (var i=sizes[0]; i<=sizes[1]; i++)
        {
          var cur_obj = {};

          cur_obj["cx"] = width_svg - 200;
          cur_obj["cy"] = 100 + (i-sizes[0])*25;
          // cur_obj["fill"] = color(keys[i]);
          cur_obj["r"] = i;

          cur_obj["x"] = width_svg - 200 + 20;
          cur_obj["y"] = 100 + (i-sizes[0])*25;
          cur_obj["text"] = Math.round(lins_axis["size"](i)*10)/10;
          
          size_arr.push(cur_obj);
        }

        

        marks_size = size_arr.map((val) => (
          // <circle cx={val.cx} cy={val.cy} r={val.r} fill={val.fill}></circle>
          <circle cx={val.cx} cy={val.cy} r={val.r} fill="gray"></circle>
        ));

      

        labels_size = size_arr.map((val) => (
          // <text x={val.x} y={val.y} fill={val.fill} textAnchor="left" alignmentBaseline="middle">{val.text}</text>
          // <text x={val.x} y={val.y} fill="gray" textAnchor="left" alignmentBaseline="middle">{val.text}</text>
          <text x={val.x} y={val.y} fill="gray" textAnchor="left" alignmentBaseline="middle">{val.text}</text>
        ));

        setMarksSize(marks_size);
        setLabelsSize(labels_size);
      }

      else if (spec_vega['mark'] === 'square')
      {
        marks_size = <g></g>;
        setMarksSize(marks_size);
        
        var cubes_legend = svg.selectAll('g.cube').data(items_legend_3d, function(d){ return d.id });

        var ce_legend, faces_return_legend;

        ce_legend = cubes_legend
          .enter()
          .append('g')
          .attr('class', 'cube')
          // .attr('fill', function(d){ return color(d.id); })
          // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(2); })
          .attr('stroke', function(d){ return d3.color(default_color).darker(3); })
          .attr('fill', function(d){ return default_color; })
          .attr('fill-opacity', function(d){ return d.opacity; })
          // .attr('fill-opacity', 1.0)
          .merge(cubes_legend);


        ce_legend.sort(cubesLegend3d.sort);


        // console.log("ce");
        // console.log(ce);
        // console.log(ce._groups[0]);
        // console.log(ce._groups[0][0]);

        var faces_legend = cubes_legend.merge(ce_legend).selectAll('path.face').data(function(d){ return d.faces; }, function(d){ return d.face; });

        faces_return_legend = faces_legend.enter()
            .append('path')
            .attr('class', 'face')
            // .attr('fill-opacity', 0.95)
            // .attr('fill-opacity', function(d){ return d.opacity; })
            .classed('_3d', true)
            .merge(faces_legend)
            // .transition().duration(tt)
            .attr('d', cubesLegend3d.draw);

        ce_legend.selectAll('._3d').sort(_3d().sort);

        var ce_arr_legend = ce_legend._groups[0];

        console.log("ce_arr_legend");
        console.log(ce_arr_legend);
        console.log(ce_arr_legend[0]);
        console.log(ce_arr_legend[1]);
        console.log(ce_arr_legend[9]);

        console.log("ce_arr_legend[0].chiledren");
        console.log(ce_arr_legend[0].childNodes);
        console.log(ce_arr_legend[0].childNodes[0]);

        var cubes_arr = [];

        for (var i=0; i<ce_arr_legend.length; i++)
        {  
          var cur_obj = {};

          cur_obj["stroke"] = ce_arr_legend[i].getAttribute("stroke");
          cur_obj["fill"] = ce_arr_legend[i].getAttribute("fill");  
          // cur_obj["fillOpacity"] = ce_arr_legend[i].getAttribute("fill-opacity");

          cur_obj["translate"] = 'translate(' + (width_svg/2 - 200) + ', ' + (100 - height_svg/1.75 + 40*i) + ')';

          cur_obj["x"] = width_svg - 200 + 30;
          cur_obj["y"] = 100 + i*40;
          cur_obj["text"] = Math.round(lins_axis["size"](sizes[0] + stride_size*i)*10)/10;
          // cur_obj["text"] = Math.round(lins_axis["size"](i)*10)/10;


          // cur_obj["translate"] = 'translate(' + (width_svg/2 - 200) + ', ' + (50 - height_svg/2) + ')';
          // cur_obj["translate"] = 'translate(' + (width_svg/2 - 200) + ', 0)';

          // if (ce_arr[i] === undefined)

          var children = ce_arr_legend[i].childNodes;
          for (var j=0; j<6; j++)
          {
            // var cur_child = children[j];

            cur_obj['d'+j] = children[j].getAttribute("d"); 

            
            // console.log("translate");
            // console.log(cur_obj["translate"]);
          }
          
          cubes_arr.push(cur_obj);
        } 

        console.log("cubes_arr_legend");
        console.log(cubes_arr);

        g_items_legend = cubes_arr.map((val) => (
          // <g transform="translate(300, 0)">
          <g transform={val.translate}>
              <path className="face _3d" fillOpacity="1" stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d0}></path>
              <path className="face _3d" fillOpacity="1" stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d1}></path>
              <path className="face _3d" fillOpacity="1" stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d2}></path>
              <path className="face _3d" fillOpacity="1" stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d3}></path>
              <path className="face _3d" fillOpacity="1" stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d4}></path>       
              <path className="face _3d" fillOpacity="1" stroke={val.stroke} strokeOpacity="1" fill={val.fill} d={val.d5}></path>
          </g>
        ));

        labels_size = cubes_arr.map((val) => (
          // <text x={val.x} y={val.y} fill={val.fill} textAnchor="left" alignmentBaseline="middle">{val.text}</text>
          // <text x={val.x} y={val.y} fill="gray" textAnchor="left" alignmentBaseline="middle">{val.text}</text>
          <text x={val.x} y={val.y} fill="gray" textAnchor="left" alignmentBaseline="middle">{val.text}</text>
        ));

        setItemsLegend(g_items_legend);
        setLabelsSize(labels_size);
      } 
    }

    else
    {
      marks_size = <div></div>;
      g_items_legend = <g></g>;
      labels_size = <div></div>;

      setMarksSize(marks_size);
      setItemsLegend(g_items_legend);
      setLabelsSize(labels_size);
    }



    if ("opacity" in spec_vega["encoding"])
    {
      var el = document.getElementsByClassName("right-panel").item(0);
      var width_svg = el.clientWidth;
      var height_svg = el.clientHeight;

      // var yLeg = d3.scaleLinear()
      //   .domain(domains['opacity'])
      //   .range([250, 100]);
      //   // .range([100, 250]);


      // var ticks = [];
      // var stride = (domains['color'][1] - domains['color'][0]) / 4;

      // var count_ticks = 0;
      // for (var i=domains['color'][0]; i<=domains['color'][1]; i+=stride)
      // {
      //   ticks[count_ticks] = i;

      //   count_ticks++;
      // }

      // console.log("ticks");
      // console.log(ticks);

      // var axisLeg = d3.axisRight(yLeg)
      // .tickValues(ticks);
      //   // .tickValues(domains['color'])
  

      //   // setLabelsColor(labels_color);
      
      // // d3.select('#svg_plot').call(axisLeg);
      // d3.select('#axisLeg_id').call(axisLeg);

      

      // document.getElementById("color_legend").style.display = null;
      // document.getElementById("axisLeg_id").style.display = null;
      
      var opacity_arr = [];

      var cnt = 0;

      for (var i=opacity[0]; i<=opacity[1]; i+=0.25)
      {
        var cur_obj = {};

        cur_obj["cx"] = 100;
        cur_obj["cy"] = height_svg - 200 + cnt*25;

        // cur_obj["fill"] = color(keys[i]);

        if ("color" in spec_vega["encoding"])
        {
          cur_obj["fill"] = "black";
        }
        else
        {
          cur_obj["fill"] = default_color;
        }

        cur_obj["r"] = default_size_legend;
        cur_obj["opacity"] = i;

       
        

        cur_obj["x"] = 120;
        cur_obj["y"] = height_svg - 200 + cnt*25; 
        cur_obj["text"] = Math.round(lins_axis["opacity"](i));
        
        opacity_arr.push(cur_obj);
        cnt++;
      }

  

      

      marks_opacity = opacity_arr.map((val) => (
        // <circle cx={val.cx} cy={val.cy} r={val.r} opacity={val.opacity} fill="gray"></circle>
        <circle cx={val.cx} cy={val.cy} r={val.r} opacity={val.opacity} fill={val.fill}></circle>
      ));

   

      labels_opacity = opacity_arr.map((val) => (  
        <text x={val.x} y={val.y} fill="gray" textAnchor="left" alignmentBaseline="middle">{val.text}</text>
      ));

      setMarksOpacity(marks_opacity);
      setLabelsOpacity(labels_opacity);
    
    }

    else
    {
      marks_opacity = <div></div>;
      labels_opacity = <div></div>;

      setMarksOpacity(marks_opacity);
      setLabelsOpacity(labels_opacity);
    }




    
    setGrid(g_grid);
    setItems(g_items);
    setScale(g_scale);
    setTextY(g_text_y);
    setTextX(g_text_x);
    setTextZ(g_text_z);
    setNameY(g_name_y);
    setNameX(g_name_x);
    setNameZ(g_name_z);
    
    
    

    // d3.select('#svg_plot').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd));

    d3.select('#svg_g').call(d3.drag().on('drag', dragged).on('start', dragStart).on('end', dragEnd));

    

    console.log("svg_plot");
    // console.log(d3.select('#svg_plot')); 
    console.log(document.querySelector("#svg_plot"));  

    // var ele = document.getElementById('g_svg_id');
    // var eleCount = ele.childElementCount;

    // console.log("eleCount");
    // console.log(eleCount);

  }

  function makeCube(x, y, z, size){
    return [
        {x: x - size, y: y-size, z: z + size}, // FRONT TOP LEFT
        {x: x - size, y: y+size, z: z + size}, // FRONT BOTTOM LEFT
        {x: x + size, y: y+size, z: z + size}, // FRONT BOTTOM RIGHT
        {x: x + size, y: y-size, z: z + size}, // FRONT TOP RIGHT
        {x: x - size, y: y-size, z: z - size}, // BACK  TOP LEFT
        {x: x - size, y: y+size, z: z - size}, // BACK  BOTTOM LEFT
        {x: x + size, y: y+size, z: z - size}, // BACK  BOTTOM RIGHT
        {x: x + size, y: y-size, z: z - size}, // BACK  TOP RIGHT
    ];
  } 


  function draw3DPlot(){
    // scatter = [];
    // cubesData = [];
    items_arr = [];
    items_legend = [];
    xLine = []; 
    yLine = []; 
    zLine = []; 
    xGrid = [];
    xName=[];
    yName=[]; 
    zName=[];
    
    
    var el = document.getElementsByClassName("right-panel").item(0);
    var width_svg = el.clientWidth;
    var height_svg = el.clientHeight;
    var origin = [width_svg/2, height_svg/1.75];
    // var scale = width_svg/40;
    var scale = width_svg/30;
    var num_lines = 10;
    var grid_size = 10;

    // console.log("rect");
    // console.log( rect.width );
    // console.log( rect.height);

    var cnt = 0;
    // var xGrid = [], scatter = [], yLine = [];
    // var j = 10;
    var cur_encoding = spec_vega["encoding"];
    // var origin = [width_svg/4, height_svg/1.5];
    
    // var origin = [width_svg/2, height_svg/1.5];
    // var origin = [0, 0];
    // var origin = [480, 300];
    // var origin = [100, 550]; 
    // var origin = [600, 400];
    // var origin = [557, 437]; //best
    // var origin = [557-300, 437+100]; //best
    // var origin = [10, 50];
    // var j = 10
    // var scale = 40;
    
    
    
    // var color  = d3.scaleOrdinal(d3.schemeCategory20);
    // var color  = d3.scaleOrdinal().range(["red", "green", "blue", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    // var svg = d3.select('svg');
    // var svg = document.getElementById("svg_plot").append('g');
    // var svg = d3.select('svg').append('g');
    // svg = d3.select('svg').append('g');
    svg = d3.select('svg');
    // console.log("svg");
    // console.log(svg._groups[0]);

    // d3.select('#svg_plot')
    // svg = d3.select('#svg_plot');

    console.log("spec_vega");
    console.log(spec_vega);

    console.log("loaded_data");
    console.log(loaded_data);

    // console.log(spec["encoding"]["x"]["scale"]["domain"]);

    

    domains["x"] = cur_encoding["x"]["scale"]["domain"];
    domains["y"] = cur_encoding["y"]["scale"]["domain"];
    domains["z"] = cur_encoding["z"]["scale"]["domain"];

    
    // if ('color' in cur_encoding && 'scale' in cur_encoding['color'])
    if ('color' in cur_encoding && cur_encoding['color']['type']==='quantitative')
    {
      domains["color"] = cur_encoding["color"]["scale"]["domain"];
    }
    if ('size' in cur_encoding)
    {
      domains["size"] = cur_encoding["size"]["scale"]["domain"];
    }
    if ('opacity' in cur_encoding)
    {
      domains["opacity"] = cur_encoding["opacity"]["scale"]["domain"];
    }

    // console.log(domains["x"]);
    console.log("domains");
    console.log(domains);

    

    lins = {};
    var xyz = ['x', 'y', 'z'];

    for (var i=0; i<xyz.length; i++)
    {  
      if (cur_encoding[xyz[i]]['type']==='quantitative')
      {
        lins[xyz[i]] = d3.scaleLinear()
        .domain(domains[xyz[i]])
        .range(ranges[xyz[i]]);
      }
      else if (cur_encoding[xyz[i]]['type']==='nominal' || cur_encoding[xyz[i]]['type']==='ordinal')
      {
        lins[xyz[i]] = d3.scaleOrdinal()
        .domain(domains[xyz[i]])
        .range(ranges[xyz[i]]);

        console.log("new_lins");
        console.log(lins[xyz[i]].range());
      }
    }

   
    
    // lins["x"] = d3.scaleLinear()
    //   .domain(domains["x"])
    //   // .range([0, grid_size]);
    //   .range([-range_val, range_val]);
    // lins["y"] = d3.scaleLinear()
    //   .domain(domains["y"])
    //   // .range([0, grid_size]);
    //   .range([0, -range_val*2]);
    // lins["z"] = d3.scaleLinear()
    //   .domain(domains["z"])
    //   // .range([0, grid_size]);
    //   .range([-range_val, range_val]);

    // if ('color' in cur_encoding && 'scale' in cur_encoding['color'])
    if ('color' in cur_encoding && cur_encoding['color']['type']==='quantitative')
    {
      lins['color'] = d3.scaleLinear()
      .domain(domains['color'])
      .range(color_schemes[cur_encoding['color']['scale']['scheme']]);
      // .range(color_schemes['viridis']);
      // .range(["#FAFA6E", "#2E5C68"]);
    }

    // console.log("lins_color_test");
    // console.log(domains['color']);
    // console.log(lins['color'](domains['color'][0]));
    // console.log(lins['color'](domains['color'][1]));
    

    // console.log("lins[color]");
    // console.log(lins['color'](1)[0]);

    if ('size' in cur_encoding)
    {
      lins["size"] = d3.scaleLinear()
        .domain(domains["size"])
        .range(sizes);
    }

    if ('opacity' in cur_encoding)
    {
      lins["opacity"] = d3.scaleLinear()
        .domain(domains["opacity"])
        .range(opacity);
    }

    // var lins_axis = {};
    lins_axis = {};

    for (var i=0; i<xyz.length; i++)
    {  
      if (cur_encoding[xyz[i]]['type']==='quantitative')
      {
        lins_axis[xyz[i]] = d3.scaleLinear()
        .domain(ranges[xyz[i]])
        .range(domains[xyz[i]]);
      }
      else if (cur_encoding[xyz[i]]['type']==='nominal' || cur_encoding[xyz[i]]['type']==='ordinal')
      {
        lins_axis[xyz[i]] = d3.scaleOrdinal()
        .domain(ranges[xyz[i]])
        .range(domains[xyz[i]]);

        // console.log("new_lins");
        // console.log(lins[xyz[i]].range());

        // console.log("lins_axis_nominal");
        // console.log(lins_axis['z'](-5));
        // console.log(lins_axis['z'].domain());
        // console.log(lins_axis['z'].range());
        // console.log(ranges['z']);
      }
    }

    // lins_axis["x"] = d3.scaleLinear()
    // // .domain([0, grid_size])  
    // .domain([-range_val, range_val])
    // .range(domains["x"]);
      
    // lins_axis["y"] = d3.scaleLinear()
    // // .domain([0, grid_size])  
    // .domain([0, -range_val*2])
    // .range(domains["y"]);
      
    // lins_axis["z"] = d3.scaleLinear()
    // // .domain([0, grid_size])  
    // .domain([-range_val, range_val])
    // .range(domains["z"]);

    if ('size' in cur_encoding)
    {
      lins_axis["size"] = d3.scaleLinear()
        .domain(sizes)
        .range(domains["size"]);
        
    }

    if ('opacity' in cur_encoding)
    {
      lins_axis["opacity"] = d3.scaleLinear()
        .domain(opacity)
        .range(domains["opacity"]);
        
    }



    for (var z = -range_val; z <=range_val; z++)
    {
      for (var x = -range_val; x <= range_val; x++)
      {
        xGrid.push([x, 1, z]);
      }
    }

    // for (var z = 0; z <= grid_size; z++)
    // {
    //   for (var x = 0; x <= grid_size; x++)
    //   {
    //     xGrid.push([x, 0, z]);
    //   }
    // }
    

    // var strides = {};
    
    // strides["x"] = Math.round((domains["x"][1]- domains["x"][0]) / num_lines);
    // strides["y"] = Math.round((domains["y"][1]- domains["y"][0]) / num_lines);
    // strides["z"] = Math.round((domains["z"][1]- domains["z"][0]) / num_lines);

    // console.log("strides");
    // console.log(strides);

    // for (var z = domains["z"][0]; z <= domains["z"][1]; z+=strides["z"])
    // {
    //   for (var x = domains["x"][0]; x <= domains["x"][1]; x+=strides["x"])
    //   {
    //     xGrid.push([x, domains["y"][0], z]);
    //   }
    // }

    // for (var z = domains["z"][0]; z <= domains["z"][1]; z++)
    // {
    //   for (var x = domains["x"][0]; x <= domains["x"][1]; x++)
    //   {
    //     xGrid.push([x, domains["y"][0], z]);
    //   }
    // }

    console.log("xGrid");
    console.log(xGrid);

    var data_arr = loaded_data["table"];

    console.log("data_arr");
    console.log(data_arr);

    // var keys = [];
    keys = [];

    for (var i=0; i<data_arr.length; i++)
    {
      var cur_i = data_arr[i];

      var cur_x = cur_i[cur_encoding["x"]["field"]];
      var cur_y = cur_i[cur_encoding["y"]["field"]];
      var cur_z = cur_i[cur_encoding["z"]["field"]];

      // if (cur_i[cur_encoding["x"]["field"]] === null || cur_i[cur_encoding["y"]["field"]] === null || cur_i[cur_encoding["z"]["field"]] === null)
      if (cur_x === null || cur_y === null || cur_z === null)
          continue;
      
      

      if (spec_vega['mark'] === 'circle')
      {
        var cur_obj = {};
        

        // cur_obj["x"] = cur_i[cur_encoding["x"]["field"]];
        // cur_obj["y"] = cur_i[cur_encoding["y"]["field"]];
        // cur_obj["z"] = cur_i[cur_encoding["z"]["field"]];

        
        

        // cur_obj["x"] = lins["x"](cur_i[cur_encoding["x"]["field"]]);
        // // cur_obj["y"] = -lins["y"](cur_i[cur_encoding["y"]["field"]]);
        // cur_obj["y"] = lins["y"](cur_i[cur_encoding["y"]["field"]]);
        // cur_obj["z"] = lins["z"](cur_i[cur_encoding["z"]["field"]]);

        cur_obj["x"] = lins["x"](cur_x);
        // cur_obj["y"] = -lins["y"](cur_i[cur_encoding["y"]["field"]]);
        cur_obj["y"] = lins["y"](cur_y);
        cur_obj["z"] = lins["z"](cur_z);

        // console.log("cur_obj[y]");
        // console.log(cur_obj["y"]);

        if ('color' in cur_encoding)
        {
          if (cur_i[cur_encoding["color"]["field"]] === null)
            continue;
          
          var cur_color = cur_i[cur_encoding["color"]["field"]];

          if (cur_encoding["color"]["type"]==='nominal' || cur_encoding["color"]["type"]==='ordinal')
          {
            cur_obj["id"] = cur_color;

            if (keys.indexOf(cur_color)===-1)
            {
              keys[keys.length] = cur_color;
            }
          } 
          else if (cur_encoding["color"]["type"]==='quantitative')
          {
            cur_obj["color"] = lins["color"](cur_i[cur_encoding["color"]["field"]]);
          }

          
        }

        if ('size' in cur_encoding)
        {
          if (cur_i[cur_encoding["size"]["field"]] === null)
            continue;

          var cur_size = cur_i[cur_encoding["size"]["field"]];
          cur_obj["size"] = lins["size"](cur_size);
        }
        else
        {
          cur_obj["size"] = default_size_mark;
        }

        if ('opacity' in cur_encoding)
        {
          if (cur_i[cur_encoding["opacity"]["field"]] === null)
            continue;
          
          var cur_opacity = cur_i[cur_encoding["opacity"]["field"]];
          cur_obj["opacity"] = lins["opacity"](cur_opacity);
        }
        else
        {
          cur_obj["opacity"] = 1;
        }

        // console.log(keys);

        
        
        items_arr.push(cur_obj);
      }
      else if (spec_vega['mark'] === 'square')
      {
        var cur_size;

        if ('size' in cur_encoding)
        {
          if (cur_i[cur_encoding["size"]["field"]] === null)
            continue;

          cur_size = lins["size"](cur_i[cur_encoding["size"]["field"]]) * ratio_cube;

          // for (var j=0; j<sizes.length; j++)
          // for (var i=sizes[0]; i<=sizes[1]; i++)
          // {
          //   var _cube_legend = makeCube(width_svg - 200, 100 + (i-sizes[0])*25, lins["z"](cur_z), cur_size);
   
          //   _cube.height = cur_size*2;


          // }

          

          // _cube["size"] = lins["size"](cur_size);
        }
        else
        {
          cur_size = half_size_cubes;
          
          // _cube.height = half_size_cubes * 2;
          
          // _cube["size"] = default_size_mark;
        }

        
        var _cube = makeCube(lins["x"](cur_x), lins["y"](cur_y), lins["z"](cur_z), cur_size);
   
        _cube.height = cur_size*2;
          
         
        


        // _cube.height = half_size_cubes * 2;

        if ('color' in cur_encoding)
        {
          if (cur_i[cur_encoding["color"]["field"]] === null)
            continue;
          
          var cur_color = cur_i[cur_encoding["color"]["field"]];

          if (cur_encoding["color"]["type"]==='nominal')
          {
            _cube["id"] = cur_color;

            if (keys.indexOf(cur_color)===-1)
            {
              keys[keys.length] = cur_color;
            }
          } 
          else if (cur_encoding["color"]["type"]==='quantitative')
          {
            _cube["color"] = lins["color"](cur_i[cur_encoding["color"]["field"]]);
          }

          
        }

        

        if ('opacity' in cur_encoding)
        {
          if (cur_i[cur_encoding["opacity"]["field"]] === null)
            continue;
          
          var cur_opacity = cur_i[cur_encoding["opacity"]["field"]];
          _cube["opacity"] = lins["opacity"](cur_opacity);
        }
        else
        {
          _cube["opacity"] = 1;
        }

        items_arr.push(_cube);
      }
    }

    console.log("items_arr");
    console.log(items_arr);


    
    if ('size' in cur_encoding)
    {
      for (var i=sizes[0]; i<=sizes[1]; i++)
      {
        var cur_size = i * ratio_cube;

        var _cube = makeCube(0, 0, 0, cur_size);

        _cube.height = cur_size*2;

        _cube.opacity = 1;

        items_legend.push(_cube);

      }
    }

    console.log("items_legend");
    console.log(items_legend);

    // console.log("scatter");
    // console.log(scatter);

    var d3_colors = [];

    // d3_colors[0] = 0x2E5C68;
    
    for (var i=0; i<9; i++)
    {
      d3_colors[d3_colors.length] = d3.schemeSet1[i];  
    }
    
    


    // var d3_category20 = [
    //   0x1f77b4, 0xaec7e8,
    //   0xff7f0e, 0xffbb78,
    //   0x2ca02c, 0x98df8a,
    //   0xd62728, 0xff9896,
    //   0x9467bd, 0xc5b0d5,
    //   0x8c564b, 0xc49c94,
    //   0xe377c2, 0xf7b6d2,
    //   0x7f7f7f, 0xc7c7c7,
    //   0xbcbd22, 0xdbdb8d,
    //   0x17becf, 0x9edae5
    // ].map(d3_rgbString);

    
    // var d3_category20 = [
    //    0xaec7e8,
    //    0xffbb78,
    //    0x98df8a,
    //   0xd62728, 0xff9896,
    //   0x9467bd, 0xc5b0d5,
    //   0x8c564b, 0xc49c94,
    //   0xe377c2, 0xf7b6d2,
    //   0x7f7f7f, 0xc7c7c7,
    //   0xbcbd22, 0xdbdb8d,
    //   0x17becf, 0x9edae5
    // ].map(d3_rgbString);

    var d3_category20 = [
      
      0xaec7e8,
      0xffbb78,
      0x98df8a,
     0xd62728, 0xff9896,
     0x9467bd, 0xc5b0d5,
     0x8c564b, 0xc49c94,
     0xe377c2, 0xf7b6d2,
     0x7f7f7f, 0xc7c7c7,
     0xbcbd22, 0xdbdb8d,
     0x17becf, 0x9edae5
   ].map(d3_rgbString);

    for (var i=0; i<20; i++)
    {
      d3_colors[d3_colors.length] = d3_category20[i]; 
    }


  if ('color' in cur_encoding && (cur_encoding["color"]['type'] === "nominal" || cur_encoding["color"]['type'] === "ordinal"))
  {
    color = d3.scaleOrdinal()
      .domain(keys)
      .range(color_schemes[cur_encoding["color"]["scale"]["scheme"]]);
      // .range(d3_colors);
  }
    
    // console.log("keys");
    // console.log(keys);

    // console.log("scheme");
    // console.log (cur_encoding["color"]["scale"]["scheme"]);

    // console.log("color");
    // console.log(color("USA"));
    
    // d3.range(domains["y"][0], domains["y"][1]+1, strides["y"]).forEach(function(d){ yLine.push([domains["x"][0], d, domains["z"][0]]); });
    // d3.range(0, grid_size+1, 1).forEach(function(d){ yLine.push([0, -d, 0]); });
    // d3.range(0, grid_size+1, 1).forEach(function(d){ xLine.push([0, -d, 0]); });
    // d3.range(0, grid_size+1, 1).forEach(function(d){ zLine.push([0, -d, 0]); });

    

    
    // yName.push([-range_val-1, -5, -range_val-1]);
    // xName.push([0, 1, range_val+2.5]);
    // zName.push([-range_val-2.5, 1, 0]);

    for (var i=0; i<xyz.length; i++)
    {  
      if (cur_encoding[xyz[i]]['type']==='quantitative')
      {
        if (xyz[i] === 'y')
          d3.range(-1, 11, 1).forEach(function(d){ yLine.push([-range_val, -d, -range_val]); });
        else if (xyz[i] === 'x')
          d3.range(-range_val, range_val+1, 1).forEach(function(d){ xLine.push([d, 1, range_val+1.5]); });
        else if (xyz[i] === 'z')
          d3.range(-range_val, range_val+1, 1).forEach(function(d){ zLine.push([-range_val-1.5, 1, d]); });
      }
      else if (cur_encoding[xyz[i]]['type']==='nominal' || cur_encoding[xyz[i]]['type']==='ordinal')
      {
        if (xyz[i] === 'y')
          yLine.push([-range_val, 1, -range_val]);

        for (var j=0; j<ranges[xyz[i]].length; j++)
        {
          if (xyz[i] === 'y')
            yLine.push([-range_val, ranges[xyz[i]][j], -range_val]);
          else if (xyz[i] === 'x')
            xLine.push([ranges[xyz[i]][j], 1, range_val+1.5]); 
          else if (xyz[i] === 'z')
            zLine.push([-range_val-1.5, 1, ranges[xyz[i]][j]]);
        }

      }
    }

    console.log("yLine");
    console.log(yLine);
    console.log("xLine");
    console.log(xLine);

    

    
    yName.push([-range_val-1, -5, -range_val-1]);
    xName.push([0, 1, range_val+2.5]);
    zName.push([-range_val-2.5, 1, 0]);
    


    // console.log("yLine");
    // console.log(yLine);

    // console.log("xLine");
    // console.log(xLine);


    grid3d = _3d()
        .shape('GRID', grid_size+1)
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);


    point3d = _3d()
        .x(function(d){ return d.x; })
        .y(function(d){ return d.y; })
        .z(function(d){ return d.z; })
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    cubes3d = _3d()
      .shape('CUBE')
      .x(function(d){ return d.x; })
      .y(function(d){ return d.y; })
      .z(function(d){ return d.z; })
      .rotateY( startAngle)
      .rotateX(-startAngle)
      .origin(origin)
      .scale(scale);

    cubesLegend3d = _3d()
      .shape('CUBE')
      .x(function(d){ return d.x; })
      .y(function(d){ return d.y; })
      .z(function(d){ return d.z; })
      .rotateY( startAngle)
      .rotateX(-startAngle)
      .origin(origin)
      .scale(scale);

    

    yScale3d = _3d()
        .shape('LINE_STRIP')
        .origin(origin)
        .rotateY(startAngle)
        .rotateX(-startAngle)
        .scale(scale);


    xScale3d = _3d()
      .shape('LINE_STRIP')
      .origin(origin)
      .rotateY(startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    
    zScale3d = _3d()
      .shape('LINE_STRIP')
      .origin(origin)
      .rotateY(startAngle)
        .rotateX(-startAngle)
        .scale(scale);


    // console.log("data_d3");
    // console.log(data_d3);

    

    var grid_3d =  grid3d(xGrid);
    console.log("CHECK");
    var yscale_3d = yScale3d([yLine]);
    console.log("CHECK2");
    var xscale_3d = xScale3d([xLine]);
    var zscale_3d = zScale3d([zLine]);
    var yname_3d = yScale3d([yName]);
    var xname_3d = xScale3d([xName]);
    var zname_3d = zScale3d([zName]);


    // var point_3d = point3d(scatter);

    

    var items_3d;
    var items_legend_3d;

    if (spec_vega['mark'] === 'circle')
    {
      items_3d = point3d(items_arr);

      items_legend_3d = 0;

      
    }
    else if (spec_vega['mark'] === 'square')
    {
      items_3d = cubes3d(items_arr);

      items_legend_3d = cubesLegend3d(items_legend);
    }

    // console.log("items_3d");
    // console.log(items_3d);
    // console.log(items_3d[0]);

    // console.log("items_legend_3d");
    // console.log(items_legend_3d);
    // console.log(items_legend_3d[0]);

    // processData(grid_3d, point_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d);
    // processData(grid_3d, items_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d);
    processData(grid_3d, items_3d, items_legend_3d, yscale_3d, xscale_3d, zscale_3d, yname_3d, xname_3d, zname_3d);
    

  }

  


  async function drawPlot(){
    // console.log("spec");
    // console.log(spec);

    console.log("drawPlot");

    spec_vega = {};
    spec_vega["width"] = 600;
    spec_vega["height"] = 600;
    spec_vega["mark"] = 'square';
    spec_vega["encoding"] = {...spec["encoding"]};
    spec_vega["data"] = {name: 'table'};

    if(spec["mark"]==='cube'){
      spec_vega["mark"] = 'square';
    }
    else if(spec["mark"]==='sphere'){
      spec_vega["mark"] = 'circle';
    }
    else{
      spec_vega["mark"] = spec["mark"];
    }


    console.log("spec_vega[encoding]");
    console.log(spec_vega["encoding"]);

    var keys_spec = Object.keys(spec_vega['encoding']);
    
    var count_channels = 0;
    var channels = [];  
    for (var i=0; i<keys_spec.length; i++)
    {
      if (keys_spec[i] === 'x' || keys_spec[i] === 'y' || keys_spec[i] === 'z')
      {
        channels[count_channels] = keys_spec[i];
        count_channels++;
      }
    }

    console.log("channels");
    console.log(channels); 


    if (channels.length === 3)
    {
      ranges = {
        'x': [-range_val, range_val],
        'y': [0, -range_val*2],
        'z': [-range_val, range_val]
      };
      
      
      for(var [key, v] of Object.entries(spec_vega["encoding"])){
        var new_encoding = {...v};
  
        // console.log("new_encoding");
        // console.log(new_encoding);
  
        if('scale' in new_encoding){
          if('domain' in new_encoding['scale']){
            var new_scale = {...new_encoding['scale']};
            var new_v = [new_scale['domain'][0],new_scale['domain'][1]];
            if(new_v[0] === 'min'){
              new_v[0] = await XRGetDataMinAPI(new_encoding["field"],value['path']);
            }
            if(new_v[0] === 'max'){
              new_v[0] = await XRGetDataMaxAPI(new_encoding["field"],value['path']);
            }
            if(new_v[1] === 'min'){
              new_v[1] = await XRGetDataMinAPI(new_encoding["field"],value['path']);
            }
            if(new_v[1] === 'max'){
              new_v[1] = await XRGetDataMaxAPI(new_encoding["field"],value['path']);
            }
            new_scale['domain'] = new_v;
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;
          }
          else if (new_encoding['type']==='quantitative')
          {
            var data_values = file_json.map(function(v) {return v[new_encoding['field']]});
             
            // spec_vega["encoding"][key]['scale'] = {};
            // spec_vega["encoding"][key]['scale']['domain'] = [Math.min.apply(null,data_values),Math.max.apply(null,data_values)];

            // var new_scale = {};
            var new_scale = {...new_encoding['scale']};
            var new_v = [Math.min.apply(null,data_values),Math.max.apply(null,data_values)];

            new_scale['domain'] = new_v;
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;
  
            
          }
          else if ((key==='x' || key==='y' || key==='z') && (new_encoding['type']==='nominal' || new_encoding['type']==='ordinal'))
          {
            var values = [];

            var data_arr = loaded_data["table"];

            for (var i=0; i<data_arr.length; i++)
            {
              var cur_value = data_arr[i][new_encoding["field"]];

              if (values.indexOf(cur_value)===-1)
              {
                values[values.length] = cur_value;
              }
            }

            var new_scale = {...new_encoding['scale']};
            var new_v = values;
            new_scale['domain'] = new_v;
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;

            console.log("spec_vega_nominal");
            console.log(spec_vega["encoding"][key]);

            var prev_range = [...ranges[key]];

            console.log("prev_range");
            console.log(prev_range);

            var cur_length = new_v.length;

            

            

            var cur_stride = (prev_range[1] - prev_range[0]) / (cur_length - 1);

            var new_range = [];
            for (var i=0; i<cur_length; i++)
            {
              new_range[i] = prev_range[0] + cur_stride * i;
            }

         

            console.log("new_range");
            console.log(new_range);

            // ranges[key] = [];

            // for (var i=0; i<new_range.length; i++)
            // {
            //   ranges[key][i] = new_range[i];

            //   console.log("new_range[i]");
            //   console.log(new_range[i]);
            // }

            ranges[key] = [...new_range];




            console.log("ranges[key]");
            console.log(ranges[key]);


    

            // var prev_range = ranges[key];

            // var cur_length = new_v.length;

            // var cur_stride = (prev_range[1] - prev_range[0]) / (cur_length - 1);

            // var new_v = [];
            // for (var i=0; i<cur_length; i++)
            // {
            //   new_v[i] = prev_range[0] + cur_stride * i;
            // }

            // ranges[key] =  new_v;

            // console.log("ranges[key]");
            // console.log(ranges[key]);
  
          }

        }
        else
        {
          // var new_scale = {};
          // new_encoding['scale'] = new_scale;
          
          if(new_encoding['type']==='quantitative'){
              var data_values = file_json.map(function(v) {return v[new_encoding['field']]});
             
              // spec_vega["encoding"][key]['scale'] = {};
  
              // spec_vega["encoding"][key]['scale']['domain'] = [Math.min.apply(null,data_values),Math.max.apply(null,data_values)];

              var new_scale = {};

              var new_v = [Math.min.apply(null,data_values),Math.max.apply(null,data_values)];

              new_scale['domain'] = new_v;
              new_encoding['scale'] = new_scale;
              spec_vega["encoding"][key] = new_encoding;
          }
          else if ((key==='x' || key==='y' || key==='z') && (new_encoding['type']==='nominal' || new_encoding['type']==='ordinal'))
          {
            var values = [];

            var data_arr = loaded_data["table"];

            for (var i=0; i<data_arr.length; i++)
            {
              var cur_value = data_arr[i][new_encoding["field"]];

              if (values.indexOf(cur_value)===-1)
              {
                values[values.length] = cur_value;
              }
            }

            var new_scale = {};
            var new_v = values;
            new_scale['domain'] = new_v;
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;

            console.log("spec_vega_nominal");
            console.log(spec_vega["encoding"][key]);

     


            // var prev_range = [];
            // prev_range[0] = ranges[key][0];
            // prev_range[1] = ranges[key][1];

            var prev_range = [...ranges[key]];

            console.log("prev_range");
            console.log(prev_range);

            var cur_length = new_v.length;

            

            

            var cur_stride = (prev_range[1] - prev_range[0]) / (cur_length - 1);

            var new_range = [];
            for (var i=0; i<cur_length; i++)
            {
              new_range[i] = prev_range[0] + cur_stride * i;
            }

         

            console.log("new_range");
            console.log(new_range);

            // ranges[key] = [];

            // for (var i=0; i<new_range.length; i++)
            // {
            //   ranges[key][i] = new_range[i];

            //   console.log("new_range[i]");
            //   console.log(new_range[i]);
            // }

            ranges[key] = [...new_range];




            console.log("ranges[key]");
            console.log(ranges[key]);

             
            
          }
        }

        if (key==='color')
        {
          // if (!('scale' in spec_vega["encoding"][key]))
          if (!('scale' in new_encoding))
          {
            // var new_scale = {};
            var new_scale = {...new_encoding['scale']};
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;
            
            // spec_vega["encoding"][key]['scale'] = {};
            // spec_vega["encoding"][key]['scale'] = {};
          }
          
          // if (!('scheme' in spec_vega["encoding"][key]['scale']))
          // {
          //   if (spec_vega["encoding"][key]['type']==='nominal' || spec_vega["encoding"][key]['type']==='ordinal')
          //   {
          //     spec_vega["encoding"][key]['scale']['scheme'] = 'tableau10';
          //   }

          //   else if (spec_vega["encoding"][key]['type']==='quantitative')
          //   {
          //     spec_vega["encoding"][key]['scale']['scheme'] = 'ramp';
          //   }
          // }

          if (!('scheme' in new_encoding['scale']))
          {
            if (new_encoding['type']==='nominal' || new_encoding['type']==='ordinal')
            {
              // spec_vega["encoding"][key]['scale']['scheme'] = 'tableau10';
              
              var new_scale = {...new_encoding['scale']};
              var new_v = 'tableau10';
              
              new_scale['scheme'] = new_v;
              new_encoding['scale'] = new_scale;
              spec_vega["encoding"][key] = new_encoding;
              
            }

            else if (spec_vega["encoding"][key]['type']==='quantitative')
            {
              // console.log("scheme");

              // spec_vega["encoding"][key]['scale']['scheme'] = 'ramp';

              var new_scale = {...new_encoding['scale']};
              var new_v = 'ramp';
              
              new_scale['scheme'] = new_v;
              new_encoding['scale'] = new_scale;
              spec_vega["encoding"][key] = new_encoding;
            }
          }
          
          var cur_length = color_schemes[new_encoding['scale']['scheme']].length;

          console.log("cur_length");
          console.log(cur_length);

          // if (!(color_schemes[new_encoding['scale']['scheme']].length === 2) && new_encoding['type'] === "quantitative")
          if (!(cur_length === 2) && new_encoding['type'] === "quantitative")
          {
            var prev_domain = new_encoding['scale']['domain'];

            var new_scale = {...new_encoding['scale']};
            
            var cur_stride = (prev_domain[1] - prev_domain[0]) / (cur_length - 1);

            var new_v = [];
            for (var i=0; i<cur_length; i++)
            {
              new_v[i] = prev_domain[0] + cur_stride * i;
            }
            
            new_scale['domain'] = new_v;
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;    
          }
        }
      }
  

      console.log("spec_vega_drawplot");
      console.log(spec_vega);
  
      
      setSpecvega(spec_vega);

      div_vega = <div></div>;
      setDivVega(div_vega);

      console.log("svg_plot_drawPlot");
      console.log(document.getElementById("svg_plot"));
      

      document.getElementById("svg_plot").style.display = null;

      

      draw3DPlot();  
    }
    else if (channels.length === 2)
    {
      if (!(channels.indexOf('z') === -1) && !(channels.indexOf('x') === -1))
      {
        spec_vega['encoding']['y'] = {};
        spec_vega['encoding']['y']['field'] = spec_vega['encoding']['z']['field'];
        spec_vega['encoding']['y']['type'] = spec_vega['encoding']['z']['type'];
      }
      else if (!(channels.indexOf('z') === -1) && !(channels.indexOf('y') === -1))
      {
        spec_vega['encoding']['x'] = {};
        spec_vega['encoding']['x']['field'] = spec_vega['encoding']['z']['field'];
        spec_vega['encoding']['x']['type'] = spec_vega['encoding']['z']['type'];
      }
  
      for(var [key, v] of Object.entries(spec_vega["encoding"])){
        var new_encoding = {...v};
  
        console.log("new_encoding");
        console.log(new_encoding);
  
        if('scale' in new_encoding){
          if('domain' in new_encoding['scale']){
            var new_scale = {...new_encoding['scale']};
            var new_v = [new_scale['domain'][0],new_scale['domain'][1]];
            if(new_v[0] === 'min'){
              new_v[0] = await XRGetDataMinAPI(new_encoding["field"],value['path']);
            }
            if(new_v[0] === 'max'){
              new_v[0] = await XRGetDataMaxAPI(new_encoding["field"],value['path']);
            }
            if(new_v[1] === 'min'){
              new_v[1] = await XRGetDataMinAPI(new_encoding["field"],value['path']);
            }
            if(new_v[1] === 'max'){
              new_v[1] = await XRGetDataMaxAPI(new_encoding["field"],value['path']);
            }
            new_scale['domain'] = new_v;
            new_encoding['scale'] = new_scale;
            spec_vega["encoding"][key] = new_encoding;
          }
        }

      }
  
      console.log("spec_vega");
      console.log(spec_vega);
       
      setSpecvega(spec_vega);

      document.getElementById("svg_plot").style.display = 'none';
      
      
      div_vega = <VegaLite spec={spec_vega} data={loaded_data} style={{margin:"auto"}}/>;
      setDivVega(div_vega);
    }
    

   
  }

  async function loadData(){
    console.log("loadData");
    // var loaded_file, file_json;
    var loaded_file;
    var ext = value['path'].split('.').slice(-1)[0];
    // console.log("ext");
    // console.log(ext);
    if(ext === 'csv')
    {
      loaded_file = await XRGetCSVAPI(value['path']);
      file_json = csvToJSON(loaded_file);
    }
    else if(ext === 'json')
    {
      // console.log("json load");
      file_json = await XRGetJSONAPI(value['path']);
      // console.log("json");
      // console.log(file_json);
    }
    else if(ext === 'api'){
      file_json = await XRGetAPIAPI(value['path']);
    }
    

    loaded_data = {};
    loaded_data["table"] = file_json;

    setLoadedData(loaded_data);

    // console.log(file_json);

    drawPlot();
  }




  var encoding_html = [];
  for (let i = 0; i < value['encoding_list'].length; i++) {
    encoding_html.push(
      <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", width: "100%", gridTemplateColumns: "130px 130px 130px 30px"}}>
        <select 
          value={value["encoding_list"][i].channel} 
          style={{width: "90%", height: "40px"}}   
          onChange={(e) => {
            // console.log(e);
            value["encoding_list"][i].channel=e.target.value;
            setRefresh(refresh + 1);  
            onChange({path: value['path'],
                      mark: value['mark'],
                      mesh: value['mesh'],
                      fieldTypes: value['fieldTypes'],
                      encoding_list: value['encoding_list']});
          }}
        >
          {
            (() => {
              var newList = [];
              for (let j = 0; j < channelTypes.length; j++) {
                newList.push(<option>{channelTypes[j]}</option>);
              }
              return newList;
            })()
          }
        </select>
        <select 
          value={value["encoding_list"][i].data_field} 
          style={{width: "90%", height: "40px"}} 
          onChange={(e) => {
            // console.log(e);
            value["encoding_list"][i].data_field=e.target.value;
            setRefresh(refresh + 1);  
            onChange({path: value['path'],
                      mark: value['mark'],
                      mesh: value['mesh'],
                      fieldTypes: value['fieldTypes'],
                      encoding_list: value['encoding_list']});
          }}
          onClick={() => {
            generateFieldList();
          }}

        >
          {
            (() => {
              var fieldTypes = value['fieldTypes'];
              var newList = [];
              for (let j = 0; j < fieldTypes.length; j++) {
                newList.push(<option>{fieldTypes[j]}</option>);
              }
              return newList;
            })()
          }          
        </select>
        <select 
          value={value["encoding_list"][i].data_type} 
          style={{width: "90%", height: "40px"}}   
          onChange={(e) => {
            // console.log(e);
            value["encoding_list"][i].data_type=e.target.value;
            setRefresh(refresh + 1);  
            onChange({path: value['path'],
                      mark: value['mark'],
                      mesh: value['mesh'],
                      fieldTypes: value['fieldTypes'],
                      encoding_list: value['encoding_list']});
          }}
        >
          {
            (() => {
              var newList = [];
              for (let j = 0; j < typeTypes.length; j++) {
                newList.push(<option>{typeTypes[j]}</option>);
              }
              return newList;
            })()
          }          
          </select>
          <div style={{width: "30px", height: "30px", paddingTop: "5px"}}>
            <IconButton onClick={() => {removeEncoding(i);}} className="button-1" icon={<CloseIcon />} color="blue" appearance="ghost" size="xs" style={{ background: '#2356ff00'}}/>
          </div>
      </div>
    );
  }

  return (
    <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    }}>
        <div className="left-panel">
          <div className="left-top-panel">
            <div style={{display: "flex", flexDirection:"row"}}>
                <div style={{display: "flex", flexDirection:"column",alignItems: "center"}}>
                    <p className="text">Data</p>
                    <input className="textEdit"
                        type="text"
                        placeholder="path..."
                        value={value['path']}
                    />
                </div>


                <div style={{display: "flex", flexDirection:"column",alignItems: "center"}}>
                    <p className="text">Mark</p>
                    <select 
                        value={mark} 
                        onChange={(e) => {
                            // console.log(e);
                            mark=e.target.value;
                            value['mark'][0]=e.target.value;
                            setMark(e.target.value);
                            setRefresh(refresh + 1); 
                            onChange({path: value['path'],
                                        mark: value['mark'],
                                        mesh: value['mesh'],
                                        fieldTypes: value['fieldTypes'],
                                        encoding_list: value['encoding_list']});
                            }
                        }
                        style={{width: "100%", height: "40px"}}      
                        >
                        {parse(markList)}
                    </select>
                </div>
            </div>

            <div style={{marginLeft: "auto", marginRight: "40px"}}>
              <Checkbox style={{color: "white", fontWeight: "700"}}
                        checked={value['mesh'][0]}
                        onChange={(v,c,e) => {
                          // console.log(c);
                          value['mesh'][0]=c;
                          setMesh(c);
                          setRefresh(refresh + 1); 
                          onChange({path: value['path'],
                                    mark: value['mark'],
                                    mesh: value['mesh'],
                                    fieldTypes: value['fieldTypes'],
                                    encoding_list: value['encoding_list']});
                        }}
                        >Mesh Rendering
                </Checkbox>
            </div>


            <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", width: "100%", gridTemplateColumns: "130px 130px 130px 30px"}}>
                <p className="text" style={{textAlign: "center",width: "90%"}}>Channel</p>
                <p className="text" style={{textAlign: "center",width: "90%"}}>Data Field</p>
                <p className="text" style={{textAlign: "center",width: "90%"}}>Data Type</p>
            </div>
            {encoding_html}


            <div style={{marginTop: "20px", marginBottom: "auto"}}>
                <IconButton onClick={() => {addNewEncoding();}} className="button-1" icon={<PlusIcon />} appearance="default" active />
            </div>
          </div>
          <div className="left-bottom-panel">
            <textarea id="vis-spec-txt" className="vis-spec-edit"
              style={{width: "100%", height: "90%"}}
              value={spec_text}
              onChange={handleTextChange}
            />
            <Button onClick={applyTextToSpec} style={{width:"98%"}} className="button-1">
              Apply
            </Button>

          </div>

        </div>




        <div className="right-panel">
          {div_vega}


          {/* <svg id="svg_plot" style={{display:"none"}}>{g_grid}{g_items}{g_scale}{g_text_y}{g_text_x}{g_text_z}{g_name_y}{g_name_x}{g_name_z}{dots}{labels}{marks_size}{labels_size} */}
          {/* <svg id="svg_plot" style={{display:"none"}}> */}
          <svg id="svg_plot" style={{display:"none"}}>
            <g id="svg_g">
            {g_grid}{g_items}{g_scale}{g_text_y}{g_text_x}{g_text_z}{g_name_y}{g_name_x}{g_name_z}{dots}{labels}{marks_size}{labels_size}{g_items_legend}{marks_opacity}{labels_opacity}  
            <defs>
              <linearGradient id="linear-gradient" x1="0%" x2="0%" y1="100%" y2="0%">
                {gradient}
                {/* <stop offset="0%" stopColor="#FAFA6E"></stop>
                <stop offset="25%" stopColor="#9AD87D"></stop>
                <stop offset="50%" stopColor="#57B085"></stop>
                <stop offset="75%" stopColor="#37867E"></stop>
                <stop offset="100%" stopColor="#2E5C68"></stop> */}
              </linearGradient>
            </defs>
            <rect id="color_legend" x="100" y="100" width="25" height="150" style={{fill: "url(#linear-gradient)", display:"none"}}></rect>
            <g id="axisLeg_id" className="axis" transform="translate(125, 0)" style={{display:"none"}}></g>  
                    
            {/* <defs>
              <linearGradient id="linear-gradient_opacity" x1="0%" x2="0%" y1="100%" y2="0%">
                <stop offset="0%" stopColor="#cccccc"></stop>
                <stop offset="25%" stopColor="#999999"></stop>
                <stop offset="50%" stopColor="#666666"></stop>
                <stop offset="75%" stopColor="#333333"></stop>
                <stop offset="100%" stopColor="#000000"></stop>
              </linearGradient></defs>
            <rect id="color_legend" x="100" y="100" width="25" height="150" style={{fill: "url(#linear-gradient_opacity)", display:"none"}}></rect>
            <g id="axisLeg_id" className="axis" transform="translate(125, 0)" style={{display:"none"}}></g>    */}
            </g>
            {/* <rect id="color_legend" x="300" y="300" width="25" height="150" style={{fill: "gray"}}></rect> */}
            
          </svg>
          {/* <svg>
            <circle cx="300" cy="300" fill="red"></circle>
          </svg> */}
        </div>

        
    </div>
  );  
};

export default InfoVis;
