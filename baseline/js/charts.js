var namespace_graphs = (function () {
    /* PRIVATE */
    var m_local_data = {};

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
                + groups[i].transactions[k].action+", "+groups[i].transactions[k].volume + " @"+
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

    function compute_rank_gauge_data(last_value, p_series_data)
    {
        var res_obj = {};
        var data =[]
        for (var i=0; i<p_series_data.length; i++)
        {
            data[i] = p_series_data[i][1];
        }
        res_obj.min_val = 1;
        res_obj.max_val = p_series_data.length -1;
        res_obj.last_val = namespace_xls.rank(last_value, data);
        return res_obj;
    }
 
    function get_bubble_chart_data(p_portfolio_data, p_benchmark_data)
    {
        var summary_data = {};
        summary_data.portfolio_pnl = p_portfolio_data["diff_percent"]; //diff.n;
        summary_data.portfolio_risk = p_portfolio_data["std_dev"];
        summary_data.benchmark_pnl = p_benchmark_data["diff_percent"];
        summary_data.benchmark_risk = p_benchmark_data["std_dev"]; 
        return summary_data;
     }  
    
     //add color to the data points 
    //also can invert the values for navigator series
    function render_risk_chart(seriesOptions, nav_data, p_container_id)
    {
       // console.log("Rendering attempt..." +p_container_id);
        $(p_container_id).highcharts('StockChart', {
            series : seriesOptions,
            rangeSelector : { selected : 5 },
            title : { text : null },
            navigator : {
             //   height:160,
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

    function render_risk_pnl_heatmap(p_container_id, p_values)
    {
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
                        ["#B0C4DE","#FF4500"], //3 a>b>0
                        ["#FF4500","#B0C4DE"], //4 b>a>0
                        ["#B0C4DE","#B0C4DE"]],//5 a=b>0
                
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
        var colors_pnl = format_value_colors(p_values.benchmark_pnl, p_values.portfolio_pnl, false, "pnl");
        var colors_risk = format_value_colors(p_values.benchmark_risk, p_values.portfolio_risk, true,"risk");
        $(p_container_id).highcharts('Chart', {
            title: { text: 'Risk and Return: Portfolio vs Benchmark' },
            chart: { type: 'heatmap'},
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
                            var y_labels=["Risk", "Return"];
                            return x_labels[this.point.x] + y_labels[this.point.y]+": "+ math_util.aux_math_round(this.point.z,2);
                        },
                        style: { fontFamily: 'sans-serif', lineHeight: '18px', fontSize: '17px' }
                    },
            }],
            yAxis: 
            {
                title:{
                    text:null
                },
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
            colorAxis: {
                min: -1.0,
                max: 1.0,
                stops: [
                    [0.0, '#7F0000'],
                    [0.25, '#3F0000'],
                    [0.45, '#1F0000'],
                    [0.5,'#1F1F1F'],
                    [0.55, '#001F00'],
                    [0.75,'#003F00'],
                    [1.0,'#007F00']
                ]
            },
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

    //render risk vs return porfolio
    function render_risk_pnl_bubble(p_container_id, p_values)
    {
        function get_color(value)
        {
            if (value>0) return '#00FF00';
            else return '#FF0000';
        }
       
        function get_size(value, type)
        {
            bubble_sizes = [4, 5, 6];
            sizes_return = [3,9];
            sizes_volatility = [15,25];
            if (type == 'return')
            {
                 if (value<=sizes_return[0])
                    return bubble_sizes[0];
                else if (value>sizes_return[0] && value<=sizes_return[1])   
                    return bubble_sizes[1];
                else if (value>sizes_return[1])
                    return bubble_sizes[2];
               
            }
            else if (type == 'risk') 
            {
                if (value<=sizes_volatility[0])
                    return bubble_sizes[0];
                else if (value>sizes_volatility[0] && value<=sizes_volatility[1])   
                    return bubble_sizes[1];
                else if (value>sizes_volatility[1])
                    return bubble_sizes[2];
            }
        }
 
        $(p_container_id).highcharts('Chart', {
            title: { text: 'Risk and Return: Portfolio vs Benchmark' },
            chart: { type: 'bubble', zoom: 'xy',
         },
         series: [{
            data: [{x:10, y:10, z:get_size(Math.abs(p_values.benchmark_pnl),'return'), color: get_color(p_values.benchmark_pnl)}, 
                   {x:10, y: 5, z:get_size(Math.abs(p_values.benchmark_risk),'risk'), color: get_color(p_values.benchmark_risk) }, 
                   {x: 5, y:10, z:get_size(Math.abs(p_values.portfolio_pnl), 'return'), color: get_color(p_values.portfolio_pnl)}, 
                   {x: 5, y: 5, z:get_size(Math.abs(p_values.portfolio_risk),'risk'), color: get_color(p_values.portfolio_risk)}],
            dataLabels: {
                        enabled: false
                    },
            sizeBy:'width'
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
   
    function render_linear_gauge(p_container_id, p_gauge_data, p_title)
    {
        $(p_container_id).highcharts('Chart', {
            chart: {
                defaultSeriesType: 'bar',
                plotBorderWidth: 2,
                plotBackgroundColor: '#F5E6E6',
                plotBorderColor: '#D8D8D8',
                plotShadow: true,
                spacingBottom: 43,
                height: 160
            },
            credits: {
                enabled: false
            },
            xAxis: {
                labels: {
                    enabled: false
                },
                tickLength: 0
            },
            title: {
                text: p_title,
                align: 'left',
                style: {
                    fontSize: '14px'
                } 
            },
            legend: {
                enabled: false
            },
            yAxis: {
                title: {
                    text: null
                },
                labels: {
                    y: 20
                },
                min: p_gauge_data.min_val,
                max: p_gauge_data.max_val,
                tickInterval: 0.02,
                minorTickInterval: 0.01,
                tickWidth: 1,
                tickLength: 8,
                minorTickLength: 5,
                minorTickWidth: 1,
                minorGridLineWidth: 0
            },
            plotOptions: {},
            series: [{
                borderColor: '#7070B8',
                borderRadius: 3,
                borderWidth: 1,
                color: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 1,
                        y2: 0
                    },
                    stops: [ //[ 0.35, '#7070B8' ], [0, '#D69999'],
                                                   [0.3, '#B84D4D'],
                                                   [0.45, '#7A0000'],
                                                   [0.55, '#7A0000'],
                                                   [0.7, '#B84D4D'],
                                                   [1, '#D69999']]
                },
                pointWidth: 50,
                data: [p_gauge_data.last_val]}]
        });
    }

    function render_risk_gauge_radial(p_container_id, p_gauge_data)
    {
        $(p_container_id).highcharts('Chart', {
            chart: {
                type: 'gauge',
            },
            pane: {
               center: ['50%', '100%'],
               size: '100%',
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

    function check_flag_edges(p_data, p_flags)
    {
        var li_flag = p_flags.length - 1;
        var li_data = p_data.length - 1;
        if (p_flags[0].x < p_data[0][0]) p_flags[0].x = p_data[1][0];
        if (p_flags[li_flag].x > p_data[li_data][0]) p_flags[li_flag].x = p_data[li_data-1][0];
        return p_flags;
    }

    function trim_data(p_data, date_start)
    {
        var p_new_data = [];
        for (var i=0;i<p_data.length; i++)
        {
            if (p_data[i][0] > date_start) p_new_data.push(p_data[i]);
        }
        return p_new_data;
    }

    function rescale_data(p_data)
    {
        var start_value = p_data[0][1];
        var return_data=[];
        for (var i = 0; i<p_data.length; i++)
            return_data[i] = [p_data[i][0], (p_data[i][1] / start_value)* 100.0];
        return return_data;
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
            var new_data = rescale_data(trim_data(p_series, date_start));
        else
            var new_data = trim_data(p_series, date_start);
        console.log(new_data);
        p_chart.series[0].setData(new_data);
        var axis = p_chart.xAxis[0];
        var edata = axis.getExtremes();
        var start_datum = xdata[0][0];
        axis.setExtremes(start_datum, edata.dataMax);
    }

    /* PUBLIC */
    return {
        // Here by each position profit or loss 
        render_position_chart: function(p_series_data, p_container_id, p_display_mode)
        {
            if (p_display_mode == 'absolute')
                var val_data = p_series_data.abs_list;
            else if (p_display_mode == 'percent')
                var val_data = p_series_data.rel_list;
            $(p_container_id).highcharts('Chart', {
                chart: {
                    marginLeft: 75
                },
                title : { text : 'Positions profit or loss'},
                xAxis: { categories : p_series_data.data_positions},
                plotOptions: {
                    column : {
                         color:'green',
                         negativeColor:'red',
                         pointWidth:20
                      }
                },
                legend : {enabled:false},
                series: [{
                    type:'column',
                    data: val_data}],
                tooltip : {
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
                },
            });
        },

        render_val_pnl_chart: function(p_series_data, p_container_id, p_display_mode, p_flag_mode, p_chart_mode, p_flag_data)
        {
            m_local_data["chart_val_pnl"] = p_series_data;
            if (p_flag_mode) 
            {
                 var chart_flags = check_flag_edges(p_series_data, p_flag_data);
            }
            else var chart_flags = []; 
            $(p_container_id).highcharts('StockChart', {
                chart : {
                    events: {
                        load: function (){
                            var chart = this;
                            $.each(chart.rangeSelector.buttons, function(index, value) {
                                value.on('click', function (e) { 
                                    update_val_pnl_chart(chart, index, p_series_data, p_display_mode); 
                                    e.preventDefault();
                                }); 
                            });
                        }
                    },
                    marginLeft: 75,
                    marginRight: 75
                },
                rangeSelector : { selected : 5 },
                title : { text : 'Portfolio Aggregated Value'},
                    plotOptions: {
                        animation: false,
                        area: {
                            fillColor: {
                                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                                    stops: [
                                        [0, Highcharts.getOptions().colors[0]],
                                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                                    ]   
                                }
                        }
                    }, 
                    series : [{
                            name : 'Your Portfolio',
                            data : p_series_data,
                            type : 'line',
                            animation: false,
                            id:'value_data',
                            tooltip: { valueDecimals: 2, useHTML:true }
                        },
                        {
                            type: 'flags',
                            name: 'Flags on series',
                            data: chart_flags,
                            onSeries: 'value_data',
                            shape: 'squarepin'
                        }]
                    
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
                function get_max(p_series_data)
                {
                    return 140;
                }

                function get_min(p_series_data)
                {
                    return 60;
                }

                $(p_container_id).highcharts('StockChart', {
                    marginLeft:75,
                    marginRight:75,
                    /* renderTo : p_container_id, */
                    rangeSelector : { selected : 5 },
                    title : { text : null},
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
                    yAxis: {
                        max : get_max(p_series_data),
                        min : get_min(p_series_data)
                    },
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
            
            render_risk_chart_group: function(p_series_data, p_portfolio_derived, p_benchmark_data, p_benchmark_derived, p_container_id)
            {
                //assuming we have the data
                var seriesOptions = [{'data':p_series_data}, {'data':p_benchmark_data}];
                var nav_data = get_benchmark_difference(seriesOptions[0].data, seriesOptions[1].data);
                var heatmap_data = get_bubble_chart_data(p_portfolio_derived, p_benchmark_derived);
                var a = compute_gauge_data(seriesOptions[0].data);
                var b = compute_gauge_data(seriesOptions[1].data);
                seriesOptions[0].data = format_series_to_color(seriesOptions[0].data, {});
                seriesOptions[0].type = 'area';
                seriesOptions[0].fillColor = {
                    linearGradient: {x1: 0, y1:0, x2: 0, y2: 1},
                    stops : [
                        [0.0, 'rgb(255, 0, 0)'],
                        [0.25, 'rgb(255,102,0)'],
                        [1.5, 'rgb(32,124, 202)']
                    ]
                }
               // console.log(seriesOptions[0].data);
               // if (heatmap_data.portfolio_risk>heatmap_data.benchmark_risk) seriesOptions[0].color = '#FF4500';
               // else  seriesOptions[0].color = '#B0C4DE';
                
                seriesOptions[1].type = 'line';
                seriesOptions[1].dashStyle = 'dot';
                seriesOptions[1].color = {
                    linearGradient: {x1:0, y1:0, x2:0, y2:1 }, 
                    stops:[ 
                        [0.0, 'rgb(255,0,0)'],
                        [0.5, 'rgb(255,255,0)'],
                        [1.0, 'rgb(0,255,0)']
                    ]
                }
                //part one
                render_risk_chart(seriesOptions, nav_data, p_container_id); 
                //part two
                //render_risk_gauge_radial('#container_chart5a', a);
                //render_risk_gauge_radial('#container_chart5b', b);
                render_linear_gauge('#container_chart5a', a, "Portfolio");
                render_linear_gauge('#container_chart5b', b, "Benchmark");
                //render_risk_gauge_radial('#container_chart5c', compute_rank_gauge_data(a.last_val, seriesOptions[0].data));
                //render_risk_gauge_radial('#container_chart5d', compute_rank_gauge_data(b.last_val, seriesOptions[1].data));
                render_risk_pnl_heatmap('#container_chart4b', heatmap_data);
            }
        };
}) ();

