var namespace_graphs = (function () {
    /* PUBLIC */
    return {
        render_value_chart: function(p_series_data, p_container_id, p_display_mode, p_flag_mode)
        {
            var chart_flags = [];
        /* if (p_flag_mode) 
                chart_flags = check_flag_edges(data, get_flag_data());
           */ 
            $(p_container_id).highcharts('StockChart', {
                    marginLeft:75,
                    marginRight:75,
                    renderTo : p_container_id,
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
        }
    };
}) ();

var namespace_charts = (function () {
    /*** private data ***/
   var stored_data = {
        value_series : {},
        pnl_series : {},
        benchmark_series : [],
        sector_chart : {},
        position_chart : {},
        short_risk_chart : {},
        long_risk_chart : {},
        portfolio_risk_gauge : {},
        benchmark_risk_gauge : {}
    };
    
    /*** define private methods ***/
    function format_date_extra(s_date)
        {
                var year = s_date.substring(0,4);
                var month = s_date.substring(5,7);
                var datex = s_date.substring(8,10);
                var true_data1= new Date(parseInt(year),parseInt(month)-1, parseInt(datex));
                return true_data1;
        }
       
    function compute_gauge_data(p_series_data)
    {
        var ret_obj = new Object();
        console.log(p_series_data);
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

        function rescale_data(p_data)
        {
                var start_value = p_data[0][1];
                var return_data=[];
                for (var i = 0; i<p_data.length; i++)
                {
                        return_data[i]=[];
                        return_data[i][0] = p_data[i][0];
                        return_data[i][1] = (p_data[i][1] / start_value)* 100.0;
                }
                return return_data;
        }

    function rescale_pnl_series(p_data)
    {
        var start_value = p_data[0][1];
                var return_data=[];
                for (var i = 0; i<p_data.length; i++)
                {
                        return_data[i]=[];
                        return_data[i][0] = p_data[i][0];
                        return_data[i][1] = (p_data[i][1] - start_value);
                }
                return return_data;
    }

        function get_date_adjusted(p_data, p_date, p_scale_flag)
        {
                var new_data = [];
                var j = 0;
                var cutoff = datetime_util.convert_date_to_ms(p_date);
                for (var i=0; i<p_data.length; i++)
                {
                        if (p_data[i][0] > cutoff)
                        {
                                new_data[j]=[];
                                new_data[j][0] = p_data[i][0];
                                new_data[j][1] = p_data[i][1];
                                j = j+1;
                        }
                }
        if (p_scale_flag=='percent')
        {
                    var newest_data = rescale_data(new_data);
                    return newest_data
        }
        else return new_data;
        }
        
        function get_benchmark_difference(p_data1, p_data2)
        {
                var r_data = new Array();
                var min_length = math_util.aux_compute_min(p_data1.length, p_data2.length);
                for (var i=0; i<min_length;i++)
                {
                        var elem = new Array();
                        elem[0] = p_data1[i][0];
                        elem[1] = p_data1[i][1] - p_data2[i][1];
                        r_data[i] = elem;
                }
                return r_data;
        }
    
    //fast chart update using cached data 
        function update_value_chart(p_chart, p_date, p_date_format, p_portfolio)
    {
        var xcount=0;
                if (p_date_format == 0)
                {
                        p_date = datetime_util.adjust_date(p_date);
                }
        var xdata = get_date_adjusted(stored_data.value_series, p_date, p_portfolio[0][1]);
        var axis = p_chart.xAxis[0];
        p_chart.series[0].setData(xdata);
                var edata = axis.getExtremes();
                var start_datum = xdata[0][0];
                axis.setExtremes(start_datum, edata.dataMax);

    }

    function update_pnl_chart(p_chart, p_date, p_date_format, p_portfolio)
    {
        var xcount=0;
                if (p_date_format == 0)
                {
                        p_date = datetime_util.adjust_date(p_date);
                }
        var xdata = get_date_adjusted(stored_data.pnl_series, p_date, p_portfolio[0][1]);
        if (p_portfolio[0][1]=='absolute') 
        {
            var ydata = rescale_pnl_series(xdata);
            p_chart.series[0].setData(ydata);
        }
        else 
        {
            p_chart.series[0].setData(xdata);
        }
        var axis = p_chart.xAxis[0];
                var edata = axis.getExtremes();
                var start_datum = xdata[0][0];
                axis.setExtremes(start_datum, edata.dataMax);
    }

    function update_benchmark_chart(p_chart, p_date, p_date_format, p_portfolio)
    {
        if (p_date_format == 0)
                {
                        p_date = datetime_util.adjust_date(p_date);
                }
        var xdata1=get_date_adjusted(stored_data.benchmark_series[0], p_date,'percent');
                var xdata2=get_date_adjusted(stored_data.benchmark_series[1], p_date,'percent');
                var axis = p_chart.xAxis[0];
                var axis2 =p_chart.xAxis[1];
                p_chart.series[0].setData(xdata1);
                p_chart.series[1].setData(xdata2);//
                var nav_data = get_benchmark_difference(xdata1,xdata2);
                p_chart.series[2].setData(nav_data);
                var edata = axis.getExtremes();
                var edata2 = axis2.getExtremes();
                var start_datum = xdata1[0][0];
                axis.setExtremes(start_datum, edata.dataMax);
                axis2.setExtremes(start_datum, edata2.dataMax);
    }

    function group_transactions_labels(p_transactions)
    {
        var group_list = [];
        var j = 0
        var max_distance = 3;
        for (var i=0; i<p_transactions.length; i++)
                {
            var not_added = true;
            var true_date = format_date_extra(p_transactions[i].b_date);
            for (var k=0; k <group_list.length; k++)
            {
                if ((true_date>= group_list[k].start_date) && (true_date<= group_list[k].end_date))
                {
                    //append transaction to the transaction list
                    not_added = false;
                    group_list[k].transactions.push({symbol:p_transactions[i].symbol,
                                     volume:p_transactions[i].volume,
                            buysell:p_transactions[i].type,
                                     price:p_transactions[i].b_price});
                }
                else 
                {
                    //check if the transaction is close enough to group bracket
                    if (datetime_util.date_distance(true_date, group_list[k].start_date)<max_distance)
                    {
                        not_added = false;
                        group_list[k].start_date = true_date;
                        group_list[k].transactions.push({symbol:p_transactions[i].symbol,
                                         volume:p_transactions[i].volume,
                               buysell:p_transactions[i].type,
                                         price:p_transactions[i].b_price});
                    }
                    else if (datetime_util.date_distance(true_date, group_list[k].end_date)<max_distance)
                    {
                        not_added = false;
                        group_list[k].start_date = true_date;
                        group_list[k].transactions.push({symbol:p_transactions[i].symbol,
                                         volume:p_transactions[i].volume,
                               buysell:p_transactions[i].type,
                                         price:p_transactions[i].b_price});
                    }
                }
            }
            if (not_added) 
            {
                //create new group
                j = k;  
                console.log(j);
                group_list[j] = new Object();
                group_list[j].start_date = true_date;
                group_list[j].end_date = true_date;
                group_list[j].transactions = new Array();
                group_list[j].transactions.push({symbol:p_transactions[i].symbol,
                                         volume:p_transactions[i].volume,
                               buysell:p_transactions[i].type,
                                         price:p_transactions[i].b_price});
                console.log(group_list);
                    
            }
        }
            return group_list;        
    }
    
    function get_flag_data()
    {
        //flag click event
        function flag_click(e)
        {
            //child window or table - do later
            //alert(this.title);

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
         console.log(strHTML);
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

    function check_flag_edges(p_data, p_flags)
    {
        //if first flag exceeds p_data first value date
        var li_flag = p_flags.length - 1;
        var li_data = p_data.length - 1;
        if (p_flags[0].x < p_data[0][0]) p_flags[0].x = p_data[1][0];
        if (p_flags[li_flag].x > p_data[li_data][0]) p_flags[li_flag].x = p_data[li_data-1][0];
        
        //set it to first date in data series
        //same for last flag
        return p_flags;
    }
    function format_hint(p_positions)
    {
        var str_hint='';
        for (var h=0; h<p_positions.length; h++)
        {
            str_hint = str_hint + p_positions[h][0] + "," +p_positions[h][1]+"<br/>";
        }
        return str_hint;
    }
   
   function render_risk_gauge_radial(p_container_id, p_gauge_data)
   {
      var p_a= new Highcharts.Chart({
            chart : {
               renderTo: p_container_id,
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
 
   function get_risk_pnl_data()
   {
      var summary_data = {};
      summary_data.portfolio_pnl = 0.15;
      summary_data.portfolio_risk = 0.24;
      summary_data.benchmark_pnl = 0.55;
      summary_data.benchmark_risk = 0.22;
      return summary_data;
   } 
   //render risk vs return porfolio
   function render_risk_pnl_bubble(p_values)
   {
      var bubble_chart = new Highcharts.Chart({
         title: {
            text: 'Risk vs Return'
         },
         chart: {
            renderTo: 'container_chart4b',
            type: 'bubble',
            zoom: 'xy',
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
   
   //render risk chart
   function render_risk_chart(seriesOptions, nav_data)
   {
      window.chart = new Highcharts.StockChart({
         series : seriesOptions,
         chart : { renderTo : 'container_chart4' },
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
    
   /*** public ***/
    return {
        create_value_chart: function(p_aggregated, p_container_id)
        {
                    var mode_p = $("#perf_select").val();
            var flags_switch = $("#flags_selected").prop("checked");
            var data_array = [[p_aggregated,mode_p]];
                    $.getJSON('data_api',{input_data:p_aggregated,type:'value_profile',flags:mode_p}, function(data) {
                stored_data.value_series = data;
                            var chart_flags = check_flag_edges(data, get_flag_data());
                            if (flags_switch==false) chart_flags=[];
                vChart = new Highcharts.StockChart({
                                chart : {
                        marginLeft:75,
                        marginRight:75,
                        renderTo : p_container_id,
                        events:
                        {
                            load:function ()
                            {
                                var chart = this,
                                                                buttons = chart.rangeSelector.buttons;
                                                                buttons[0].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(1);
                                                                            update_value_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[1].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(3);
                                                                            update_value_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                buttons[2].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(6);
                                                                            update_value_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[3].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(0);
                                                                            update_value_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[4].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(12);
                                                                            update_value_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[5].on('click', function(e) {
                                                                var st_date = $("#1").children(".book_date").text();
                                                                            update_value_chart(chart,st_date,1,data_array);
                                                                        e.preventDefault();
                                                                });
                            }
                        }
                    },
                                rangeSelector : { selected : 5 },
                                title : { text : 'Portfolio Aggregated Value'},
                    plotOptions: {
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
                                            data : data,
                            type : 'area',
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
                    });
            },

        create_performance_chart: function(p_aggregated, p_container_id)
            {
                    var mode_p = $("#perf_select").val();
            var flags_switch = $("#flags_selected").prop("checked");
            var data_array = [[p_aggregated,mode_p]];
                    $.getJSON('data_api',{input_data:p_aggregated,type:'pnl_profile',flags:mode_p}, function(data) {
                stored_data.pnl_series = data;
                var chart_flags = check_flag_edges(data, get_flag_data());
                            if (flags_switch==false) chart_flags=[];
                ppChart = new Highcharts.StockChart({chart : { 
                    renderTo : p_container_id,
                    marginLeft:75,
                    marginRight:75,     
                    events: {
                        load:   function (){
                                var chart = this,
                                                                buttons = chart.rangeSelector.buttons;
                                                                buttons[0].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(1);
                                                                            update_pnl_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[1].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(3);
                                                                            update_pnl_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                buttons[2].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(6);
                                                                            update_pnl_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[3].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(0);
                                                                            update_pnl_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[4].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(12);
                                                                            update_pnl_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                });
                                                                buttons[5].on('click', function(e) {
                                                                var st_date = $("#1").children(".book_date").text();
                                                                            update_pnl_chart(chart,st_date,1,data_array);
                                                                        e.preventDefault();
                                                                });
                            }
                        }

                    },
                                rangeSelector : {selected : 5},
                        title : { text : 'Portfolio Net Profit'},
                    plotOptions: {
                        area: {
                                        fillColor: {
                                            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                                            stops: [
                                                    [0, '#007F00'],
                                    [0.5, '#7F7F00'],
                                                    [1, '#7F0000']
                                    ]   
                                        }
                        }
                    },
                                series : [{
                                        name : 'Your Portfolio',
                                        data : data,
                        type : 'area',
                        id: 'perf_data',
                                        tooltip: {valueDecimals: 2,useHTML:true}
                                },
                    {
                                        type: 'flags',
                                        name: 'Flags on series',
                                        data: chart_flags,
                                        onSeries: 'perf_data',
                                        shape: 'squarepin'
                                }]
                            });
                    });
            },

           create_positions_chart: function(p_data)
            {
                    var data_positions=[];
                    var data_pnl = [];
                    var j = 0;
            var mode_p = $("#perf_select").val();
                    var hash_table = new Object();
                    for (var i = 0; i <p_data.length; i++)
                    {
                            if (p_data[i].value!="-")
                            {
                    if (mode_p=='absolute')
                                        data_pnl[j] = parseFloat(p_data[i].value);
                    else if (mode_p=='percent')
                        data_pnl[j] = parseFloat(p_data[i].xpnl);
                    data_positions[j] = p_data[i].symbol;
                                    j = j + 1;
                                    var index_id = p_data[i].symbol;
                                    hash_table[index_id] = new Object();
                    if (mode_p=='absolute')
                                        hash_table[index_id] = { volume: p_data[i].volume, xpnl: p_data[i].value};
                    else if (mode_p=='percent')
                        hash_table[index_id] = { volume: p_data[i].volume, xpnl: p_data[i].xpnl};
                            }
                    }
                    stored_data.position_chart = new Highcharts.Chart({
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
                    });
            },
        
           create_risk_charts: function(p_aggregated)
            {
                    var xdate = $("#1").children(".book_date").text();
                    var benchmark = namespace_ui.create_benchmark_data(xdate);
                    var chart_data= [[p_aggregated,'percent'],[benchmark,'benchmark']];
                    var model_data = $("#model_select").val();
                  var model_range= $("#range_select").val();
                    var full_req = model_data+','+model_range+','+'LN_YES';
                    var seriesOptions=[];
                    var counter = 0;
                  //get data for  risk chart
                    $.each(chart_data, function (i, value){
                     $.getJSON('data_api',{input_data:value[0],type:'risk_profile',model:full_req,xflag:value[1]},
                             function(data) {
                           seriesOptions[i]={
                              name: value[0],
                              data: data
                                 };
                           counter++;
                           if (counter == chart_data.length)
                           {
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
                              render_risk_chart(seriesOptions, nav_data);
                              //part two
                                     render_risk_gauge_radial('container_chart5a', a);
                              render_risk_gauge_radial('container_chart5b', b);
                              // part threee
                              render_risk_pnl_bubble(bubble_data);
                          }
               });
         });
        },
        //create comparative charts to see performance difference
        create_benchmark_chart: function(p_aggregated)
            {
                    var seriesOptions=[];
                    var xdate = $("#1").children(".book_date").text();
                    var benchmark = namespace_ui.create_benchmark_data(xdate);
                    var data_array = [[p_aggregated,'percent'],[benchmark,'benchmark']];
                    var counter=0;
                    $.each(data_array, function (i, value){
                            $.getJSON('data_api',{input_data:value[0],type:'value_profile',flags:value[1]},function(data){
                                    seriesOptions[i]={
                                        name: value,
                                        data: data
                    };
                    stored_data.benchmark_series[i] = data;
                                    counter++;
                                    if (counter == data_array.length)
                                    {
                                            var nav_data=get_benchmark_difference(seriesOptions[0].data, seriesOptions[1].data);
                                            pChart = new Highcharts.StockChart({ chart : {
                            renderTo : 'container_chart3',
                                                    events: {
                                                            load: function () {
                                                                    var chart = this,
                                                                    buttons = chart.rangeSelector.buttons;
                                                                    buttons[0].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(1);
                                                                            update_benchmark_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                    });
                                                                    buttons[1].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(3);
                                                                            update_benchmark_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                    });
                                                                    buttons[2].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(6);
                                                                            update_benchmark_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                    });
                                                                    buttons[3].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(0);
                                                                            update_benchmark_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                    });
                                                                    buttons[4].on('click', function(e) {
                                                                            var st_date = datetime_util.get_date_shifted(12);
                                                                            update_benchmark_chart(chart,st_date,0,data_array);
                                                                            e.preventDefault();
                                                                    });
                                                                    buttons[5].on('click', function(e) {
                                                                var st_date = $("#1").children(".book_date").text();
                                                                            update_benchmark_chart(chart,st_date,1,data_array);
                                                                        e.preventDefault();
                                                                    });
                                                            }
                            }   
                                            },
                                            title : {
                                                        text : 'Portfolio Performance vs Benchmark'
                                                },
                        rangeSelector : {selected : 5},
                                            navigator : {
                                                    //adaptToUpdatedData: false,
                                                    series : {
                                                            type: 'area',
                                                            data: nav_data,
                                                            color: '#00FF00',
                                                            negativeColor: '#FF0000'
                                                    },
                                                    height:160,
                                                    yAxis : {
                                                            gridLineWidth:1,
                                                            offset: 100,
                                                            labels : {
                                                                    enabled:true
                                                            },
                                                            tickPixelInterval: 40,
                                                            tickWidth:1,
                                                            title: {
                                                                    text: "Performance Differencei, %"
                                                           },
                                                    xAxis : {
                                                            offset: -100
                                                            }
                                                    }   
                                            },
                                            series : seriesOptions
                                        });
                                    }
                            });
                    });
            },
        create_sector_chart: function()
            {
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
                        });})
            }
                 
    };
}) ();
    
