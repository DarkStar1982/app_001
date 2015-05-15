var namespace_graphs = (function () {
    /* PRIVATE */
    var m_local_data = {};
	var p_chart_val_pnl_hc_options = {};
	var p_chart_val_pnl_report_obj = {};
	var p_chart_positions_report_obj = {};
	var p_chart_sector_report_obj = {};
	var p_chart_heatmap_report_obj = {}
	var p_chart_quadrant_report_obj = {};
	var p_chart_risk_report_obj ={};

	/**
	 * Dark theme for Highcharts JS
	 * @author Torstein Honsi
	 * @modified by Dennis Silin
	 */

	// Load the fonts
	Highcharts.theme = {
	    colors: ["#2b908f", "#90ee7e", "#f45b5b", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee",
	        "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
	    chart: {
	        backgroundColor: "#272b30",
	        style: {
	            fontFamily: "'Helvetica', sans-serif"
	        },
	        plotBorderColor: '#606063'
	    },
	    title: {
	        style: {
	            color: '#E0E0E3',
	            fontSize: '20px'
	        }
	    },
	    subtitle: {
	        style: {
	            color: '#E0E0E3'
	        }
	    },
	    xAxis: {
	        gridLineColor: '#707073',
	        labels: {
	            style: {
	                color: '#E0E0E3'
	            }
	        },
	        lineColor: '#707073',
	        minorGridLineColor: '#505053',
	        tickColor: '#707073',
	        title: {
	            style: {
	                color: '#A0A0A3'

	            }
	        }
	    },
	    yAxis: {
	        gridLineColor: '#707073',
	        labels: {
	            style: {
	                color: '#E0E0E3'
	            }
	        },
	        lineColor: '#707073',
	        minorGridLineColor: '#505053',
	        tickColor: '#707073',
	        tickWidth: 1,
	        title: {
	            style: {
	                color: '#A0A0A3'
	            }
	        }
	    },
	    tooltip: {
	        backgroundColor: 'rgba(0, 0, 0, 0.85)',
	        style: {
	            color: '#F0F0F0'
	        }
	    },
	    plotOptions: {
	        series: {
	            dataLabels: {
	                color: '#B0B0B3'
	            },
	            marker: {
	                lineColor: '#333'
	            }
	        },
	        boxplot: {
	            fillColor: '#505053'
	        },
	        candlestick: {
	            lineColor: 'white'
	        },
	        errorbar: {
	            color: 'white'
	        }
	    },
	    legend: {
	        itemStyle: {
	            color: '#E0E0E3'
	        },
	        itemHoverStyle: {
	            color: '#FFF'
	        },
	        itemHiddenStyle: {
	            color: '#606063'
	        }
	    },
	    credits: {
	        style: {
	            color: '#666'
	        }
	    },
	    labels: {
	        style: {
	            color: '#707073'
	        }
	    },

	    drilldown: {
	        activeAxisLabelStyle: {
	            color: '#F0F0F3'
	        },
	        activeDataLabelStyle: {
	            color: '#F0F0F3'
	        }
	    },

	    navigation: {
	        buttonOptions: {
	            symbolStroke: '#DDDDDD',
	            theme: {
	                fill: '#505053'
	            }
	        }
	    },

	    // scroll charts
	    rangeSelector: {
	        buttonTheme: {
	            fill: '#505053',
	            stroke: '#000000',
	            style: {
	                color: '#CCC'
	            },
	            states: {
	                hover: {
	                    fill: '#707073',
	                    stroke: '#000000',
	                    style: {
	                        color: 'white'
	                    }
	                },
	                select: {
	                    fill: '#000003',
	                    stroke: '#000000',
	                    style: {
	                        color: 'white'
	                    }
	                }
	            }
	        },
	        inputBoxBorderColor: '#505053',
	        inputStyle: {
	            backgroundColor: '#333',
	            color: 'silver'
	        },
	        labelStyle: {
	            color: 'silver'
	        }
	    },

	    navigator: {
	        handles: {
	            backgroundColor: '#666',
	            borderColor: '#AAA'
	        },
	        outlineColor: '#CCC',
	        maskFill: 'rgba(255,255,255,0.1)',
	        series: {
	            color: '#7798BF',
	            lineColor: '#A6C7ED'
	        },
	        xAxis: {
	            gridLineColor: '#505053'
	        }
	    },

	    scrollbar: {
	        barBackgroundColor: '#808083',
	        barBorderColor: '#808083',
	        buttonArrowColor: '#CCC',
	        buttonBackgroundColor: '#606063',
	        buttonBorderColor: '#606063',
	        rifleColor: '#FFF',
	        trackBackgroundColor: '#404043',
	        trackBorderColor: '#404043'
	    },

	    // special colors for some of the
	    legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
	    background2: '#505053',
	    dataLabelsColor: '#B0B0B3',
	    textColor: '#C0C0C0',
	    contrastTextColor: '#F0F0F3',
	    maskColor: 'rgba(255,255,255,0.3)'
	};

	// Apply the theme


 /*   function get_benchmark_difference(p_data1, p_data2)
    {
        var r_data = new Array();
        var min_length = math_util.aux_compute_min(p_data1.length, p_data2.length);
        for (var i=0; i<min_length;i++)
        {
            r_data[i] = [p_data1[i][0], p_data1[i][1] - p_data2[i][1]];
        }
        return r_data;
    } */
 
    function get_bubble_chart_data(p_portfolio_data, p_benchmark_data)
    {
        var summary_data = {};
        summary_data.portfolio_pnl = p_portfolio_data["diff_percent"]; //diff.n;
        summary_data.portfolio_risk = p_portfolio_data["std_dev"];
        summary_data.benchmark_pnl = p_benchmark_data["diff_percent"];
        summary_data.benchmark_risk = p_benchmark_data["std_dev"]; 
        return summary_data;
     }  
    
	function update_risk_chart_report_object(p_series, p_nav_data)
	{
		p_chart_risk_report_obj = {
			"series": p_series,
            "title": { "text" : null},
			//"title" : {"text":"Risk: Portfolio vs Benchmark"},
            "plotLines": [{
               "value": 0,
               "color": "#000000",
               "zIndex" : 5,
               "width": 1
            }],
            "plotOptions" : {
               "series" : {
                   "turboThreshold" :10000,
                     "dataGrouping" : {
						 "approximation": "high",
						 "enabled": false
                     }
            	 }
            }
		};
	}
    //add color to the data points 
    //also can invert the values for navigator series
    function render_risk_chart(seriesOptions, nav_data, p_container_id)
    {
		update_risk_chart_report_object(seriesOptions);
        $(p_container_id).highcharts('StockChart', {
			chart : {
				/* plotBackgroundColor :{
					linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
	                stops: [
						[0.0, 'rgba(255, 220, 220, 0.5)'],
						[0.5, 'rgba(255, 220, 220, 0.5)'],
						[0.5, 'rgba(255, 255, 220, 0.2)'],
						[0.75, 'rgba(255, 255, 220, 0.2)'],
						[0.6, 'rgba(220, 255, 220, 0.5)'],
		                [1.0, 'rgba(220, 255, 220, 0.5)']
					]
				},  */
				events: {
                   	load: function (){
						var chart = this;
						m_local_data["risk_chart"] = chart;
                       	$.each(chart.rangeSelector.buttons, function(index, value) {
                           	value.on('click', function (e) { 
								//update_risk_chart(chart, index, m_local_data["risk_data"]);
								update_risk_chart(chart, index, m_local_data["risk_chart_data"]);
								update_performance_chart(m_local_data["perf_chart"], index, m_local_data["pnl_data"]);
								update_heatmap_chart(index);
								e.preventDefault();
                           	}); 
                       	});
                   	}
				}
            }, 
            series : seriesOptions,
            rangeSelector : { selected : 5 },
            title : { text : null },
            navigator : {
             	//height:160,
                series : {
                    type: 'column',
                    fillColor: '#AF0000',   
                    data: nav_data,
                    color: '#AF0000',
                    threshold: 0,
                    negativeColor: '#00AF00'
                },
                yAxis : {
                    gridLineWidth:0,
                    tickPixelInterval: 10,
                    tickWidth:1,
                    labels : { enabled:true },
                    title: { text: "Volatility Difference, %" },
                    xAxis : { offset: -120 }
                }
            },
           yAxis : {
			min:0,   
			gridLineWidth: 1,
            labels : { formatter: function() { return Math.abs(this.value) } },  
            plotLines: [{
               value: 0,
               color: '#000000',
               zIndex : 5,
				width: 1
            }],
			},
			xAxis : {
				gridLineWidth: 0,
         },
         plotOptions : {
            series : {
                turboThreshold :10000,
                  dataGrouping : {
                          approximation: 'high',
                     enabled: false
                    }
            }
         }
      });
    }

    function format_series_to_color(p_series, p_gradient)
    {
        function point_color(p_value)
        {
            if (p_value<0.1) return '#7F7F7F'
            else if (p_value>0.1 && p_value <0.2) return '#7F4F4F';
            else return "orange";
        }

        var new_series=[];
        for (var i=0; i<p_series.length;i++)
        {
            new_series[i]={x:p_series[i][0], y:p_series[i][1], color: point_color(p_series[i][1])};
        } 
        return new_series;
    }
	
    function format_value_colors(p_value_1, p_value_2, inverted_compare, color_type)
    {
        var color_table = {
            "pnl": [["#7F0000","#FF0000"], //0 0>a>b
                    ["#FF0000","#7F0000"], //1 0>b>a
                    ["#7F0000","#7F0000"], //2 0>a=b
                    ["#00AF00","#007F00"], //3 a>b>0
                    ["#007F00","#00AF00"], //4 b>a>0
                    ["#007F00","#007F00"]],//5 a=b>0
            "risk":[["#7F0000","#FF0000"], //0 0>a>b
                    ["#FF0000","#7F0000"], //1 0>b>a
                    ["#7F0000","#7F0000"], //2 0>a=b
                    ["#B0C4B0","#FFC0C0"], //3 a>b>0
                    ["#FFC0C0","#B0C4B0"], //4 b>a>0
                    ["#B0C4B0","#B0C4B0"]],//5 a=b>0
            
        }
        if (p_value_1>=0 && p_value_2>=0)
        {
            if (inverted_compare)
            {
                if (p_value_1>p_value_2) return color_table[color_type][4];
                else if (p_value_1<p_value_2) return color_table[color_type][3];
                else return color_table[color_type][5];
            
            }
            else
            {
                if (p_value_1>p_value_2) return color_table[color_type][3]
                else if (p_value_1<p_value_2) return color_table[color_type][4]
                else return color_table[color_type][5];
            }
        }
        else if (p_value_1<0 && p_value_2<0)
        {
            if (p_value_1>p_value_2)
                return color_table[color_type][0]
            else if (p_value_1<p_value_2)
                return color_table[color_type][1]
            else return color_table[color_type][2];
        }
        else 
        {
            var colors = ["",""];
            if (p_value_1>=0) colors[0]=color_table[color_type][5][0];
            else colors[0] = color_table[color_type][2][0];
            if (p_value_2>=0) colors[1]=color_table[color_type][5][0];
            else colors[1] = color_table[color_type][2][0];
            return colors;
        }
    }
	
	function update_heatmap_chart_object(p_values, p_colors_pnl, p_colors_risk)
	{
		p_chart_heatmap_report_obj = {
             "title": { "text" : null},
			//"title": { "text": "Risk and Return: Portfolio vs Benchmark" },
			"chart": { "type": "heatmap"},
			"series": [{
				"data" : [
					{
						"x": 0,
					 	"y": 1, 
					 	"value": "Benchmark PnL: " + math_util.aux_math_round(p_values.benchmark_pnl,2),
					 	"color": p_colors_pnl[0]
					},
                    {
						"x": 0,
						"y": 0, 
						"value": "Benchmark Risk: " +math_util.aux_math_round(p_values.benchmark_risk,2),
						"color": p_colors_risk[0]
					}, 
                    {
						"x": 1,
						"y": 1,
						"value": "Portfolio PnL: " + math_util.aux_math_round(p_values.portfolio_pnl,2),
						"color": p_colors_pnl[1]}, 
                    {
						"x": 1,
						"y": 0,
						"value": "Portfolio Risk: "+ math_util.aux_math_round(p_values.portfolio_risk,2),
						"color":p_colors_risk[1]
					}
				],
				"dataLabels" : {
					"enabled": true
				}
			}]
   		};
	}
	
	function get_heatmap_hint(p_type, p_value)
	{
		if (p_type == 1)
		{
			if (p_value<0.0)
				return "Negative returns";
			else if (p_value<5.0)
			{
				return "Low returns";
			}
			else if (p_value<7.5)
			{
				return "Average returns";
			}
			else return "High returns";
		}
		else if (p_type == 0)
		{
			if (p_value<0.1)
			{
				return "Low risk";
			}
			else if (p_value<0.2)
			{
				return "Medium risk";
			}
			else return "High risk";
		}
	}
	
    function render_risk_pnl_heatmap(p_container_id, p_values)
    {
        var colors_pnl = format_value_colors(p_values.benchmark_pnl, p_values.portfolio_pnl, false, "pnl");
        var colors_risk = format_value_colors(p_values.benchmark_risk, p_values.portfolio_risk, true,"risk");
		update_heatmap_chart_object(p_values, colors_pnl, colors_risk);
        $(p_container_id).highcharts('Chart', {
            title: { text: null },
            chart: { 
				type: 'heatmap',
				marginBottom: 55
			},
            series: [{
                data: [{"x": 0, "y": 1, "z": p_values.benchmark_pnl, "color": colors_pnl[0]},
                       {"x": 0, "y": 0, "z": p_values.benchmark_risk, "color": colors_risk[0]}, 
                       {"x": 1, "y": 1, "z": p_values.portfolio_pnl, "color": colors_pnl[1]}, 
                       {"x": 1, "y": 0, "z": p_values.portfolio_risk, "color":colors_risk[1]}],
                dataLabels: {
                        enabled: true,
                        color: 'white',
                      //  format:'{point.value:.2f}',
                        formatter: function ()
                        {
                            var x_labels=["Benchmark ", "Portfolio "];
                            var y_labels=["(risk)", "(return)"];
							var hint_label = get_heatmap_hint(this.point.y, this.point.z);
							var val_label = x_labels[this.point.x] +": "+ math_util.aux_math_round(this.point.z,2);
                            return val_label + "<br/>"+ hint_label;
                        },
                        style: { fontFamily: 'sans-serif', lineHeight: '18px', fontSize: '17px' }
                    },
            }],
			legend : {enabled: false},
            yAxis: 
            {
                title:{text:null},
                labels: {
                    formatter : function()
                    {
                        var str_list = ['Risk', 'Return'];
                        return str_list[this.value];
                    }
                }
            },
            xAxis: 
            {
                labels: {
                    formatter : function()
                    {
                        var str_list = ['Benchmark', 'Portfolio'];
                        return str_list[this.value];
                    }
                }
            },
			tooltip : { enabled: false},
            plotOptions: {
                series: {
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            },
        });
    }

	function update_quadrant_chart_object(p_data, p_axis_data, p_offsets)
	{
		var label_portfolio =  "Portfolio <br/>Rt. "+ math_util.aux_math_round(p_data[0].y,2)+"%";
	    var hint_label_1 = "<br/>Rsk. " + p_data[0].x; 
        var data_label_1 = label_portfolio + "<br/>"+ hint_label_1;
		
	   var label_benchmark = "Benchmark <br/>Rt. "+ math_util.aux_math_round(p_data[1].y,2)+"%";
	   var hint_label_2 = "<br/>Rsk. " + p_data[1].x; 
       var data_label_2 = label_benchmark + "<br/>"+ hint_label_2;
		
		p_chart_quadrant_report_obj = {
			chart: {
			    defaultSeriesType:'bubble',
				plotBackgroundColor :{
					linearGradient: { x1: 0.5, y1: 0, x2: 0.5, y2: 1},
	                stops: [
						[0.0, 'rgba(220, 255, 220, 0.75)'],
						[0.49, 'rgba(220, 255, 220, 0.75)'],
						[0.5, 'rgba(0, 0, 0, 0.75)'],
						[0.51, 'rgba(255, 220, 220, 0.75)'],
		                [1.0, 'rgba(255, 220, 220, 0.75)']
					]
	            }
			},
			plotOptions : {
				bubble:{
					minSize: 30,
					maxSize: 35
				}
			},
			credits: {enabled:false},
			title: {
			        text:null
		    },
			tooltip: {
				enabled: false
			},
		    legend:{
		        enabled: true                                
			},
			
			    xAxis:{
			        title:{
			            text:'Risk'
			        },
			        min:0,
			        max:p_axis_data[0],
			        tickLength:0,
			        minorTickLength:0,
			        gridLineWidth:1,
			        showLastLabel:true,
			        showFirstLabel:true,
			        lineColor:'#ccc',
			        lineWidth:1                
			    },
			    yAxis:{
			        title:{
			            text:'Returns',
			            rotation:-90,
			            margin:25,
			        },
			        min:-p_axis_data[1],
			        max:p_axis_data[1],
			        tickLength:0,
			        gridLineWidth:1,
			        minorTickLength:0,
			        lineColor:'#ccc',
			        lineWidth:1        
			    },
			    series: [{
			        data: [p_data[0]],
					name: "Portfolio",
	                dataLabels: {
	                	enabled: true,
	                    color: 'black',
						y: p_offsets[0],
						x: 0,
	                    format: data_label_1,
	                    style: { fontFamily: 'Verdana, sans-serif', lineHeight: '16px', fontSize: '15px' }
	            		},
				},
				{
					data: [p_data[1]],
					name: "Benchmark",
	                dataLabels: {
	                	enabled: true,
	                    color: 'black',
						y: p_offsets[1],
						x: 0,
	                    format: data_label_2,
	                    style: { fontFamily: 'Verdana, sans-serif', lineHeight: '16px', fontSize: '15px' }
	            		},
				}]
		};
	}
    //render risk vs return comparison
  
	function render_quadrant_chart(p_container_id, p_data, p_axis_data)
	{
		// get label offsets - if bubble is high on chart, put label below it 
		// otherwise below 
		//console.log(p_data[0].y);
		//console.log(p_data[1].y);
		var offsets = [];
		for (var i=0; i<p_data.length; i++)
		{
			if ((p_data[i].y > p_axis_data[1]/2) || (p_data[i].y < -p_axis_data[1]/2))
			{
				offsets[i] = 45; 
			}
			else offsets[i] = -45;
		}
		update_quadrant_chart_object(p_data,p_axis_data, offsets);
        $(p_container_id).highcharts('Chart', {
			chart: {
			    defaultSeriesType:'bubble',
				plotBackgroundColor :{
					linearGradient: { x1: 0.5, y1: 0, x2: 0.5, y2: 1},
	                stops: [
						[0.0, 'rgba(220, 255, 220, 0.75)'],
						[0.49, 'rgba(220, 255, 220, 0.75)'],
						[0.5, 'rgba(0, 0, 0, 0.75)'],
						[0.51, 'rgba(255, 220, 220, 0.75)'],
		                [1.0, 'rgba(255, 220, 220, 0.75)']
					]
	            }
			},
			plotOptions : {
				bubble:{
					minSize: 30,
					maxSize: 35
				}
			},
			credits: {enabled:false},
			title: {
			        text:null
		    },
			tooltip: {
				enabled: false
			},
		    legend:{
		        enabled: true                                
			},
			
			    xAxis:{
			        title:{
			            text:'Risk'
			        },
			        min:0,
			        max:p_axis_data[0],
			        tickLength:0,
			        minorTickLength:0,
			        gridLineWidth:1,
			        showLastLabel:true,
			        showFirstLabel:true,
			        lineColor:'#ccc',
			        lineWidth:1                
			    },
			    yAxis:{
			        title:{
			            text:'Returns',
			            rotation:-90,
			            margin:25,
			        },
			        min:-p_axis_data[1],
			        max:p_axis_data[1],
			        tickLength:0,
			        gridLineWidth:1,
			        minorTickLength:0,
			        lineColor:'#ccc',
			        lineWidth:1        
			    },
			    series: [{
			        data: [p_data[0]],
					name: "Portfolio",
	                dataLabels: {
	                	enabled: true,
	                    color: 'black',
						y: offsets[0],
						x: 0,
	                    formatter: function ()
	                        {
							  var val_label = "Portfolio <br/>Rt. "+ math_util.aux_math_round(this.point.y,2)+"%";
							  var hint_label = "<br/>Rsk. " + this.point.x; 
	                          return val_label + "<br/>"+ hint_label;
	                        },
	                    style: { fontFamily: 'sans-serif', lineHeight: '16px', fontSize: '14px' }
	            		},
				},
				{
					data: [p_data[1]],
					name: "Benchmark",
	                dataLabels: {
	                	enabled: true,
	                    color: 'black',
						y: offsets[1],
						x: 0,
	                    formatter: function ()
	                        {
							  var val_label = "Benchmark <br/>Rt. "+ math_util.aux_math_round(this.point.y,2)+"%";
							  var hint_label = "<br/>Rsk. " + this.point.x; 
	                          return val_label + "<br/>"+ hint_label;
	                        },
	                    style: { fontFamily: 'sans-serif', lineHeight: '16px', fontSize: '14px' }
	            		},
				}]
			
		});
	}
	
    function check_flag_edges(p_data, p_flags)
    {
        var li_flag = p_flags.length - 1;
        var li_data = p_data.length - 1;
        if (p_flags[0].x < p_data[0][0]) p_flags[0].x = p_data[1][0];
        if (p_flags[li_flag].x > p_data[li_data][0]) p_flags[li_flag].x = p_data[li_data-1][0];
        return p_flags;
    }

	function update_heatmap_chart(p_index)
	{
		if (p_index==5) var index = 0;
		else var index = p_index +1;
        var heatmap_data = get_bubble_chart_data(m_local_data["portfolio_derived"][index], m_local_data["benchmark_derived"][index]);
		render_risk_pnl_heatmap('#container_chart4b', heatmap_data);
		var data = get_bubbles(heatmap_data);
		render_quadrant_chart('#container_chart5a',data["bubbles"], data["max_axis"]);
		namespace_gui.update_derived_tab(m_local_data["portfolio_derived"][index], m_local_data["benchmark_derived"][index]);
	}


	function update_risk_chart(p_chart, p_index, p_series)
	{
		//update risk data here
		// TODO
		// update performance chart here
      	var axis = p_chart.xAxis[0];
		var edata = axis.getExtremes();
		if (p_index == 5)
		{
				p_chart.series[0].setData(p_series[0][0]);
				p_chart.series[1].setData(p_series[1][0]);
                var nav_data = namespace_time_series.get_difference(p_series[0][0], p_series[1][0]);
				p_chart.series[2].setData(nav_data);
		   	 	var start_datum = p_series[0][0][0];
		}
		else{
			p_chart.series[0].setData(p_series[0][p_index+1]);
			p_chart.series[1].setData(p_series[1][p_index+1]);
            var nav_data = namespace_time_series.get_difference(p_series[0][p_index+1], p_series[1][p_index+1]);
			p_chart.series[2].setData(nav_data);
	   	 	var start_datum = p_series[0][0][p_index+1];
		}
     	axis.setExtremes(start_datum[0], edata.dataMax);
	}
	function update_performance_chart(p_chart, p_index, p_series)
	{
	   	
      	var axis = p_chart.xAxis[0];
		var edata = axis.getExtremes();
		if (p_index==5)
		{
			p_chart.series[0].setData(p_series[0].data[0]);
			p_chart.series[1].setData(p_series[1].data[0]);
	   	 	var start_datum = p_series[0].data[0][0];
		}
		else
		{
        	p_chart.series[0].setData(p_series[0].data[p_index+1]); 
    		p_chart.series[1].setData(p_series[1].data[p_index+1]); 
	   	 	var start_datum = p_series[0].data[0][p_index+1];
		}
     	axis.setExtremes(start_datum[0], edata.dataMax);
	}
	
    function update_val_pnl_chart(p_chart, p_index, p_series, p_mode)
    {
        var date_shifts = [1,3,6,0,12];
        if (p_index==5) 
            var date_shifted = namespace_gui.get_start_date();
        else
            var date_shifted = datetime_util.get_date_shifted(date_shifts[p_index]);
        var date_start = datetime_util.convert_date_to_ms(date_shifted);
        //alert(date_start);
        //trim data by date
        if (p_mode == "percent")
            var new_data = namespace_time_series.rescale_data(namespace_time_series.trim_data(p_series, date_start));
        else
            var new_data = namespace_time_series.trim_data(p_series, date_start);
		//<--- this part matters for chart updates
        p_chart.series[0].setData(new_data); 
        var axis = p_chart.xAxis[0];
        var edata = axis.getExtremes();
        var start_datum = xdata[0][0];
        axis.setExtremes(start_datum, edata.dataMax);
		// -- >
    }

	function update_val_pnl_chart_report_object(p_series_data, p_chart_mode, p_flag_data)
	{
		p_chart_val_pnl_report_obj = {
			"xAxis" : {"type":"datetime"},
			"series": [{
				"name" : "Your Portfolio",
			    "data" : p_series_data,
			    "type" : "line",
			    "animation" : false,
			    "id" : "value_data"
			}]
		};
		if (p_chart_mode == "val_chart")
		{
			p_chart_val_pnl_report_obj["yAxis"]={"title": {"text":"Net Value"}};
			p_chart_val_pnl_report_obj["title"] = { "text" : null}; 
 		   	//{ "text" : "Portfolio Aggregated Value"};
        
		}
		else if (p_chart_mode == "pnl_chart")
		{
			p_chart_val_pnl_report_obj["yAxis"] = {"title": {"text":"Net PnL"} };
			p_chart_val_pnl_report_obj["title"] = { "text" : null};
			//{ "text" : "Profit or Loss"};
		}
	}
	
	function update_position_chart_report_object(p_val_data, p_positions)
	{
		p_chart_positions_report_obj = {
            "title": { "text" : null},
			//"title" : { 
			//	"text" : "Positions profit or loss"
			//},
            "xAxis": { "categories" : p_positions},
            "plotOptions": {
                "column" : {
                     "color":"green",
                     "negativeColor":"red",
                     "pointWidth":20
            	}
            },
            "series": [{
                "type":"column",
                "data": p_val_data}],
		};
	}
	
	function update_sector_chart_report_object(p_series_data)
	{
        p_chart_sector_report_obj = {
            "title": { "text" : null},
            //"title" : { "text" : 'Portfolio Industry Sectors'},
            "plotOptions": { 
                "pie": {
                    "allowPointSelect": true,
                    "cursor": "pointer",
                	"dataLabels": {
                    	"enabled": true,
                    	"color": "#000000",
                   		"connectorColor": "#FF0000",
                    	"borderColor" : "#000000",
                    	"borderWidth" : 1,
                    	"style": {
                        	"fontWeight": "bold", 
							"fontSize": 10
                    	}
                	}
				}                  
         	},
         	"series": [{
                   "type": "pie",
                   "name": "Portfolio structure",
                   "data": p_series_data
            }]
		};
	}
	
	function get_bubbles(p_data)
	{
		var bubbles = [
			{"x":p_data.portfolio_risk, "y":p_data.portfolio_pnl, z:1, "color":'#007F7F', "name": "Portfolio"},
			{"x":p_data.benchmark_risk, "y":p_data.benchmark_pnl, z:1, "color":'#7F7F00', "name": "Benchmark"}
		];
		var x_max = 1.2 * (Math.max(p_data.portfolio_risk, p_data.benchmark_risk));
		var y_max = 1.2 * (Math.max(Math.abs(p_data.portfolio_pnl), Math.abs(p_data.benchmark_pnl)));
        return {"bubbles":bubbles,"max_axis":[x_max, y_max]};
	}
	
	function get_axis_data(p_data)
	{
		var axis={};
		axis.x_max =p_databubbles
	}
    /* PUBLIC */
    return {
		
		return_quadrant_chart_object: function()
		{
			return p_chart_quadrant_report_obj;
		},
		
		return_performance_chart_object: function()
		{
			return p_chart_returns_hc_options;
		},
		
		return_val_pnl_chart_object: function()
		{
			return p_chart_val_pnl_report_obj;
		},
		
		return_position_chart_object: function()
		{
			return p_chart_positions_report_obj;
		},
		
		return_sector_chart_object: function()
		{
			return p_chart_sector_report_obj;
		},
		
		return_heatmap_chart_object: function()
		{
			return p_chart_heatmap_report_obj;
		},
		
		return_risk_chart_object: function()
		{
			return p_chart_risk_report_obj;
		},
		
		init_chart_style: function()
		{
			Highcharts.setOptions(Highcharts.theme);
		},
		
        // Here by each position profit or loss 
        render_position_chart: function(p_series_data, p_container_id, p_display_mode)
        {
            if (p_display_mode == 'absolute')
			{
                var val_data = p_series_data.abs_list;
				update_position_chart_report_object(val_data, p_series_data.data_positions[0]);
				var x_scale = p_series_data.data_positions[0];
				var y_scale = [-p_series_data.max_pnl, p_series_data.max_pnl];
			}
            else if (p_display_mode == 'percent')
			{
                var val_data = p_series_data.rel_list;
				var y_scale = [-p_series_data.max_pnl_rel, p_series_data.max_pnl_rel];	
				var x_scale = p_series_data.data_positions[1];
				update_position_chart_report_object(val_data, p_series_data.data_positions[1]);
			}
            $(p_container_id).highcharts('Chart', {
                chart: {
					type: 'column',
                    marginLeft: 75
                },
                title : { text : 'Positions profit or loss'},
				yAxis : {
					min: y_scale[0],
        			max: y_scale[1],
        			tickLength:3,
        			minorTickLength:0,
				},
               xAxis: { categories : x_scale},
               plotOptions: {
                    column : {
                         color:'green',
                         negativeColor:'red',
                         pointWidth:20
                      }
                },
                legend : {enabled:false}, 
                series: [{
                    data: val_data}],
              /*  tooltip : {
                    formatter: function() {
                        if (p_display_mode == 'absolute')
                        {
                            var end_char = '$';
                            return "Symbol: "+ this.x + "<br/>Volume: " + p_series_data.hash_table[this.x].volume 
                            + "<br/>Abs. PnL: " + p_series_data.hash_table[this.x].xpnl+end_char;
                        }
                        else if (p_display_mode == 'percent')
                        {
                            var end_char = '%';
                            return "Symbol: "+ this.x + "<br/>Volume: " + p_series_data.hash_table[this.x].volume 
                            + "<br/>Pc. PnL: " + p_series_data.hash_table[this.x].rpnl+end_char;
                       }
                   }
                }, */
            });
        },

        render_val_pnl_chart: function(p_series_data, p_container_id, p_display_mode, p_flag_mode, p_chart_mode, p_flag_data)
        {
			update_val_pnl_chart_report_object(p_series_data, p_chart_mode);
            m_local_data["chart_val_pnl"] = p_series_data;
            if (p_flag_mode) 
            {
                 var chart_flags = check_flag_edges(p_series_data, p_flag_data);
            }
            else var chart_flags = []; 
			var val_pnl_chart_object = {
            	"tooltip": { "enabled": false },
				"chart": {
	                "events": {
	                    "load": function (){
	                        var chart = this;
	                        $.each(chart.rangeSelector.buttons, function(index, value) {
	                            value.on('click', function (e) { 
	                                update_val_pnl_chart(chart, index, p_series_data, p_display_mode); 
	                                e.preventDefault();
	                            }); 
	                        });
	                    }
	                },
	                "marginLeft": 75,
	                "marginRight": 75
				},
				"plotOptions": {
                    "animation": false,
                    "area": {
                        "fillColor": {
                            "linearGradient": { "x1": 0, "y1": 0, "x2": 0, "y2": 1},
                             "stops": [
                             	[0, Highcharts.getOptions().colors[0]],
                                [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                  		   	]
						}
                    }
				},
				"series":[{
            		"name" : "Your Portfolio",
                	"data" : p_series_data,
                	"type" : "line",
                	"animation": false,
                	"id":"value_data"
					},
            		{
					"type": "flags",
                	"name": "Flags on series",
                	"data": chart_flags,
                	"onSeries": "value_data",
                	"shape": "squarepin"
            	}]
			}
			if (p_chart_mode == "val_chart")
			{
				val_pnl_chart_object["yAxis"]={"title": {"text":"Net Value"}};
				val_pnl_chart_object["title"] = { "text" : "Portfolio Aggregated Value"};
        
			}
			else if (p_chart_mode == "pnl_chart")
			{
				val_pnl_chart_object["yAxis"]={"title": {"text":"Net PnL"} };
				val_pnl_chart_object["title"] = { "text" : "Profit or Loss"};
			}
	        $(p_container_id).highcharts('StockChart', val_pnl_chart_object);
        },

        render_sector_chart: function(p_series_data, p_container_id)
        {
			update_sector_chart_report_object(p_series_data);
            $(p_container_id).highcharts('Chart', {
                title : { text : 'Portfolio Industry Sectors'},
                plotOptions: { 
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#FF0000',
                        borderColor : '#000000',
                        borderWidth : 1,
                        style: {
                            fontWeight: 'bold' , fontSize: 10
                        }
                    }
                }                  
             },
             tooltip : { formatter: function() {
                //var hint_str = format_hint(hint_positions[this.key]);
                return "hint_str";
                }
              },
              series: [{
                       type: 'pie',
                       name: 'Portfolio structure',
                       data: p_series_data
                      }]
             });
            },
            
            render_performance_chart: function(p_series_data, p_container_id)
            {
				m_local_data["pnl_data"] = p_series_data;
                var y_axis_limits_1 = math_util.get_series_min_max(p_series_data[0].data[0]);
                var y_axis_limits_2 = math_util.get_series_min_max(p_series_data[1].data[0]);
                if (y_axis_limits_1.min<y_axis_limits_2.min) 
					var y_min = y_axis_limits_1.min-5;
                else 
					var y_min = y_axis_limits_2.min-5;
                if (y_axis_limits_1.max>y_axis_limits_2.max) 
					var y_max = y_axis_limits_1.max+5;
                else 
					var y_max = y_axis_limits_2.max+5;
                //save chart options for report object
				p_chart_returns_hc_options = {
                    "marginLeft": 75,
                    "marginRight": 75,
                    "rangeSelector" : { "selected" : 5 },
                    "title": { "text" : null },
                    "yAxis": {
                        "max" : y_max,
                        "min" : y_min
                    },
                    "series" : [{
						name: p_series_data[0].name,
						data: p_series_data[0].data[0],
						type: p_series_data[0].type
					},
					{
						name: p_series_data[1].name,
						data: p_series_data[1].data[0],
						type: p_series_data[1].type
					}]
				};
				// render chart
				 $(p_container_id).highcharts('StockChart', {
					"chart" : {
						"events": {
	                    	"load": function (){
	                        	var chart = this;
								m_local_data["perf_chart"] = chart;
								//reload series
								//recompute series 
								// update charts
	                        	$.each(chart.rangeSelector.buttons, function(index, value) {
	                            	value.on('click', function (e) { 
										update_performance_chart(chart, index, p_series_data);
										update_heatmap_chart(index);
										update_risk_chart(m_local_data["risk_chart"], index, m_local_data["risk_chart_data"]);
										e.preventDefault();
	                            	}); 
	                        	});
	                    	}
						}
	                }, 
                    "marginLeft": 75,
                    "marginRight": 75,
                    "rangeSelector" : { "selected" : 5 },
                    "title": { "text" : null },
                    "yAxis": {
                        "max" : y_max,
                        "min" : y_min
                    },
                    "series" : [{
						name: p_series_data[0].name,
						data: p_series_data[0].data[0],
						type: p_series_data[0].type
					},
					{
						name: p_series_data[1].name,
						data: p_series_data[1].data[0],
						type: p_series_data[1].type,
						dashStyle: 'dot',
					//	color : 'green'
					}]
				});
            },
            
			render_risk_chart_only: function(p_series_data, p_benchmark_data, p_container_id)
			{
				m_local_data["risk_chart_data"] = [p_series_data,p_benchmark_data]; 
                var nav_data = namespace_time_series.get_difference(p_series_data[0], p_benchmark_data[0]);
				var seriesOptions = [{'data':p_series_data[0]}, {'data':p_benchmark_data[0]}];
                seriesOptions[0].data = format_series_to_color(p_series_data[0], {});
                seriesOptions[0].type = 'line';
                seriesOptions[1].type = 'line';
                seriesOptions[1].dashStyle = 'dot';
				//seriesOptions[1].color = 'green';
				
				//render chart
				render_risk_chart(seriesOptions, nav_data, p_container_id);
			},
			
			//	create risk_chart only
            render_risk_chart_group: function(p_series_data, p_portfolio_derived, p_benchmark_data, p_benchmark_derived, p_container_id, p_rank_mode)
            {
               //assuming we have the data
               // var seriesOptions = [{'data':p_series_data[0]}, {'data':p_benchmark_data}];
               //  var nav_data = namespace_time_series.get_difference(seriesOptions[0].data, seriesOptions[1].data);
				m_local_data["portfolio_derived"] = p_portfolio_derived;
				m_local_data["benchmark_derived"] = p_benchmark_derived;
                var heatmap_data = get_bubble_chart_data(p_portfolio_derived[0], p_benchmark_derived[0]);
                // seriesOptions[0].data = format_series_to_color(seriesOptions[0].data, {});
				var data = get_bubbles(heatmap_data);
				render_quadrant_chart('#container_chart5a',data["bubbles"], data["max_axis"]);
                namespace_graphs.render_risk_chart_only(p_series_data, p_benchmark_data, p_container_id); 
                render_risk_pnl_heatmap('#container_chart4b', heatmap_data);
            }
        };
}) ();

