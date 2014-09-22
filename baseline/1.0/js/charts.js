var namespace_graphs = (function () {
    /* PRIVATE */
    function get_flag_data()
    {
        //flag click event
        function flag_click(e)
        {
            var trim_string = this.title.replace(/@/g,',');
            trim_string = trim_string.replace('<p style="cursor: pointer">','')
            trim_string = trim_string.replace('</p>','')
            var paragraph_data = trim_string.split('<br/>');
            var strHTML='<table>';
            for (i=0;i<paragraph_data.length-1;i++)
            {
                var list_data = paragraph_data[i].split(',');
                var htmlData = "<tr>"
                for (j=0;j<list_data.length;j++)
                {
                    htmlData = htmlData + '<td>'+list_data[j]+'</td>';
                }
                htmlData=htmlData +"</tr>";
                strHTML=strHTML+htmlData;
            }
            document.getElementById('detail_cell').innerHTML = strHTML+"</table>";  
        }

        //entry point
        var obj_flags = namespace_ui.get_portfolio_transactions();
        var groups = group_transactions_labels(obj_flags);
        var flag_data = new Array();
        for (var i=0; i<groups.length; i++)
        {
            flag_data[i] = new Object();
            var x_date = groups[i].start_date;
            flag_data[i].x = x_date;
            flag_data[i].title='<p style="cursor: pointer">';
            flag_data[i].events = { "click" : flag_click};
            for (var k=0; k<groups[i].transactions.length; k++)
            {
                var label = groups[i].transactions[k].symbol+", "
                + groups[i].transactions[k].buysell+", "+groups[i].transactions[k].volume + " @"+
                groups[i].transactions[k].price;
                flag_data[i].title = flag_data[i].title +label+"<br/>";
            }
            flag_data[i].title=flag_data[i].title+"</p>"
        }
        return flag_data;
    }

    function get_benchmark_difference(p_data1, p_data2)
    {
        var r_data = new Array();
        var min_length = math_util.aux_compute_min(p_data1.length, p_data2.length);
        for (var i=0; i<min_length;i++)
        {
            r_data[i] = [p_data1[i][0], p_data1[i][1] - p_data2[i][1]];
        }
        return r_data;
    }
    
    function compute_gauge_data(p_series_data)
    {
        var ret_obj = new Object();
        ret_obj.min_val = 0.0;
        ret_obj.max_val = 0.0;
        ret_obj.last_val = 0.0;
        for (var i=0; i<p_series_data.length; i++)
        {
            if (p_series_data[i][1]>ret_obj.max_val) ret_obj.max_val = math_util.aux_math_round(p_series_data[i][1],3);
            if (p_series_data[i][1]<ret_obj.min_val) ret_obj.min_val = math_util.aux_math_round(p_series_data[i][1],3);
        }
        ret_obj.last_val = math_util.aux_math_round(p_series_data[p_series_data.length-1][1],3);
        return ret_obj;
    }
 
    function get_risk_pnl_data()
    {
        var summary_data = {};
        summary_data.portfolio_pnl = 0.15;
        summary_data.portfolio_risk = 0.24;
        summary_data.benchmark_pnl = 0.55;
        summary_data.benchmark_risk = 0.22;
        return summary_data;
     }  
    
     //add color to the data points 
    //also can invert the values for navigator series
    function postprocess_data(p_data, p_color, p_x_mul)
    {
        var data_a = new Array;
        for (var i = 0; i <p_data.length; i++)
        {
            data_a[i] = {x:p_data[i][0],y:p_data[i][1]*p_x_mul,color:p_color};
        }
        return data_a;
    } 

    function render_risk_chart(seriesOptions, nav_data, p_container_id)
    {
       // console.log("Rendering attempt..." +p_container_id);
        $(p_container_id).highcharts('StockChart', {
            series : seriesOptions,
            rangeSelector : { selected : 5 },
            title : { text : 'Portfolio Risk Profile' },
            navigator : {
                height:160,
                series : {
                    type: 'area',
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
            labels : { formatter: function() { return Math.abs(this.value) } },  
            plotLines: [{
               value: 0,
               color: '#000000',
               zIndex : 5,
               width: 1
            }],
         },
         plotOptions : {
                series : {
                  turboThreshold :10000,
                  dataGrouping : {
                           approximation: 'high',
                     enabled: true
                        }
            }
         }
      });
    }
    //render risk vs return porfolio
    function render_risk_pnl_bubble(p_container_id, p_values)
    {
        $(p_container_id).highcharts('Chart', {
            title: { text: 'Risk vs Return' },
            chart: { type: 'bubble', zoom: 'xy',
         },
         series: [{
            data: [{x:10, y:10, z:p_values.benchmark_pnl}, 
                   {x:10, y: 5, z:p_values.benchmark_risk}, 
                   {x:5,y:10,z:p_values.portfolio_pnl}, 
                   {x:5,y:5, z:p_values.portfolio_risk}],
            dataLabels: {
                        enabled: true
                    }
         }],
         yAxis: {
            min: 2.5,
            max: 12.5,
            lineWidth: 0,
            gridLineWidth: 0,
            minorGridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            labels: {
               enabled: false
            },
            plotLines : [{ 
                  value: 7.5,
                  color: 'black',
                  width: 2
                }]
         },
         xAxis: {
            min: 0,
            max: 15,
            lineWidth: 0,
            gridLineWidth: 0,
            minorGridLineWidth: 0,
            minorTickLength: 0,
            tickLength: 0,
            labels: {
               enabled: false
            },
            plotLines : [{ 
                 value: 7.5,
                 color: 'black', 
                 width: 2  
               }]   
         }
      },
      function(chart) 
      {
         var text1 = chart.renderer.text(
            'Portfolio Return', 
             chart.plotLeft + 100, 
             chart.plotTop + 10
         ).attr({
            zIndex: 5
        }).add();
        var text2 = chart.renderer.text(
                'Benchmark  Return', 
                chart.plotLeft + 800, 
                chart.plotTop + 10
            ).attr({
                zIndex: 5
            }).add();
      var text3 = chart.renderer.text(
                'Portfolio Risk', 
                chart.plotLeft + 100, 
                chart.plotTop + 300
            ).attr({
                zIndex: 5
            }).add();
      var text4 = chart.renderer.text(
                'Benchmark Risk', 
                chart.plotLeft + 800, 
                chart.plotTop + 300
            ).attr({
                zIndex: 5
            }).add();


      });
   } 
   

    function render_risk_gauge_radial(p_container_id, p_gauge_data)
    {
        $(p_container_id).highcharts('Chart', {
            chart: {
                type: 'solidgauge',
            },
            pane: {
               center: ['50%', '100%'],
               size: '200%',
               startAngle: -90,
               endAngle: 90,
               background: {
                  backgroundColor:  '#F700F7',
                  innerRadius: '60%',
                  outerRadius: '100%',
                  shape: 'arc'
               }
            },
            yAxis: {
               min: p_gauge_data.min_val,
               max: p_gauge_data.max_val, 
            },
            series : [{
               name : 'Volatility',
               data : [p_gauge_data.last_val]
            }]
      });

    }

    /* PUBLIC */
    return {
        // Here by each position profit or loss 
        render_position_chart: function(p_series_data, p_container_id, p_display_mode)
        {
            $(p_container_id).highcharts('Chart', {
                title : { text : 'Positions profit or loss'},
                xAxis: { categories : p_series_data.data_positions},
                plotOptions: {
                    column : {
                         color:'green',
                         negativeColor:'red',
                         pointWidth:20
                      }
                },
               
                series: [{
                    type:'column',
                    data: p_series_data.data_list}]
             });
        /* 
            chart : {
                renderTo : 'container_chart2b',
                type: 'column'
            },
            title : { text : 'Positions profit or loss'},
            xAxis: { categories : data_positions},
            plotOptions: {
                column : {
                         color:'green',
                         negativeColor:'red',
                         pointWidth:20
                      }
            },
            legend : {display:false},
             tooltip : {
              formatter: function() {
                if (mode_p == 'absolute')
                var end_char = '$';
               else if (mode_p == 'percent')
                         var end_char = '%';
                          return "Symbol: "+ this.x 
                        + "<br/>Volume: " + hash_table[this.x].volume 
                        + "<br/>PnL: "+hash_table[this.x].xpnl+end_char;
                   }
              },
            series: [{data: data_pnl}]
            */
        },

        render_val_pnl_chart: function(p_series_data, p_container_id, p_display_mode, p_flag_mode, p_chart_mode)
        {
            var chart_flags = [];
            if (p_flag_mode) 
            {
                //    chart_flags = check_flag_edges(data, get_flag_data());
            } 
            $(p_container_id).highcharts('StockChart', {
                    marginLeft:75,
                    marginRight:75,
                    /* renderTo : p_container_id, */
                    rangeSelector : { selected : 5 },
                    title : { text : 'Portfolio Aggregated Value'},
                    /*plotOptions: {
                        area: {
                            fillColor: {
                                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                                    stops: [
                                        [0, Highcharts.getOptions().colors[0]],
                                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                                    ]   
                                }
                        }
                    }, */
                    series : [{
                            name : 'Your Portfolio',
                            data : p_series_data,
                            type : 'area',
                            id:'value_data',
                            tooltip: { valueDecimals: 2, useHTML:true }
                        }] /*,
                        {
                            type: 'flags',
                            name: 'Flags on series',
                            data: chart_flags,
                            onSeries: 'value_data',
                            shape: 'squarepin'
                        }*/
                    
            });
        },

        render_sector_chart: function(p_series_data, p_container_id)
        {
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
            /* 
            var prows=$("#net_rows").children("tr");
            var table=new Object;
            var net_value=0.0;
            var s=0;
            var aa=[];
            i = 0;
            var xtable = new Array;
            var tooltip_data = [];
            //get positions
                    prows.each(function(index)
                    {
                            symbol = $(this).children(".sum_asset").text();
                            xvalue = $(this).children(".sum_cur_val").text();
                            xtable[i] = [symbol,xvalue];
                            i = i + 1;
                            net_value = net_value + parseFloat(xvalue);
                    });
                    //get sector data   
                    var positions = {};
            $.each(xtable, function (i, value){ $.get("data_api",{id:value[0], type:"sector"},function(data) {
                                sector = data;
                                if (table[sector]==undefined) {
                                        table[sector] = value[1];
                                        positions[sector] = [];
                                       positions[sector].push([value[0],value[1]]);
                                }
                                else
                                {
                                        positions[sector].push([value[0],value[1]]);
                                        table[sector] = parseFloat(table[sector]) + parseFloat(value[1]);
                                }
                                s = s+1;
                                if (s == xtable.length)
                                {
                                        var final_table = new Array;
                                        var j=0;
                                        var hint_positions  = {};
                                        for (var k in table)
                                        {
                                                if (table.hasOwnProperty(k))
                                                {
                                                    test_array=new Array;
                                                        test_array[1]=table[k]/net_value;
                                                        test_array[0] = k + " : "
                                                                + math_util.aux_currency_round(test_array[1]*100.0)+"%";
                                                        final_table[j]=test_array;
                                                        hint_positions[test_array[0]] = positions[k];
                                                        j = j + 1;
                                                }
                                        }
                                        stored_data.sector_chart = new Highcharts.Chart({ chart : {
                                                        renderTo : 'container_chart0',
                                                        type: 'pie'
                                                },
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
                                                                            style: {fontWeight: 'bold' , fontSize: 10}
                                                                    }
                                }                  
                                    },
                                                tooltip : { formatter: function() {
                                var hint_str = format_hint(hint_positions[this.key]);
                                return hint_str;
                                                        }
                                                },
                        series: [{
                                                        type: 'pie',
                                                        name: 'Portfolio structure',
                                                        data: final_table
                                                }]
                                        });
                                }
                        });}) */
            },
            
            render_performance_chart: function(p_series_data, p_container_id)
            {
                $(p_container_id).highcharts('StockChart', {
                    marginLeft:75,
                    marginRight:75,
                    /* renderTo : p_container_id, */
                    rangeSelector : { selected : 5 },
                    title : { text : 'Portfolio Performance'},
                    /*plotOptions: {
                        area: {
                            fillColor: {
                                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                                    stops: [
                                        [0, Highcharts.getOptions().colors[0]],
                                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                                    ]   
                                }
                        }
                    }, */
                    series : p_series_data
                    /*,
                        {
                            type: 'flags',
                            name: 'Flags on series',
                            data: chart_flags,
                            onSeries: 'value_data',
                            shape: 'squarepin'
                        }*/
                    
                });
    
            },
                 
            
            render_risk_chart_group: function(p_series_data, p_benchmark_data, p_container_id)
            {
                //assuming we have the data
                var seriesOptions = [{'data':p_series_data}, {'data':p_benchmark_data}];
                var nav_data = get_benchmark_difference(seriesOptions[0].data, seriesOptions[1].data);
                var bubble_data = get_risk_pnl_data();
                var a = compute_gauge_data(seriesOptions[0].data);
                var b = compute_gauge_data(seriesOptions[1].data);
                seriesOptions[0].data = postprocess_data(seriesOptions[0].data,'#0000FF', 1.0);
                seriesOptions[1].data = postprocess_data(seriesOptions[1].data,'#000000', -1.0);
                seriesOptions[0].type = 'area';
                seriesOptions[0].fillColor =  {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2:1 },
                        stops: [
                               [0, 'rgb(255,0,0)'],
                               [0.7, 'rgb(255,211,0)'],
                               [1, 'rgb(0,255,0)']
                        ]
                };
                seriesOptions[1].type = 'area';
                seriesOptions[1].fillColor =  {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                                 stops: [
                                             [0, 'rgb(0,255,0)'],
                                             [0.45, 'rgb(255,211,0)'],
                                             [1, 'rgb(255,0,0)']
                                          ]
                };
                //part one
                render_risk_chart(seriesOptions, nav_data, p_container_id); 
                //part two
  
             render_risk_gauge_radial('#container_chart5a', a);
             render_risk_gauge_radial('#container_chart5b', b);
             render_risk_pnl_bubble('#container_chart4b', bubble_data);
            }
        };
}) ();

