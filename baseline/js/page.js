/* ENTRY POINT */
$(document).ready(function(){
    /* Initialize */
    namespace_portfolio.initialize();
    /* bind event handlers */
    $("#cash_add").on('click', namespace_gui.deposit_cash);
    $("#cash_remove").on('click', namespace_gui.remove_cash);
    $("#transaction_add").on('click', namespace_gui.add_trade_row);
    $("#benchmark_add").on('click', namespace_gui.add_dashboard_benchmark_row);
    $("#perf_select").on('change', namespace_gui.refresh_val_pnl_chart);
    $("#chart_select").on('change', namespace_gui.refresh_val_pnl_chart);
    $("#benchmark_list").on('change', namespace_gui.refresh_performance_chart_and_tab);
    $("#flags_selected").on('change', namespace_gui.refresh_val_pnl_chart);
});

/* GUI ACTIONS  interactions code */
var namespace_gui = (function() {
    // PRIVATE DATA
    var API_URL = "/data_api/:2000";
    var portfolio_chart_data = {};
    var m_benchmark_data ={};
    var m_start_date = undefined; 
    // Implementation
    function create_transaction_row(obj)
    {
        var new_row = '<tr id="' + obj.gui_id 
            + '"><td class="asset_name">'+ obj.asset
            + '</td><td class="sector_label">' + obj.sector 
            + '</td><td class="buysell_label">' + obj.type
            + '</td><td class="volume_label">'+ obj.volume
            + '</td><td class="book_date">' + obj.book_date
            + '</td><td class="book_price">' + obj.book_price
            + '</td><td class="current_price">'+ obj.last_price
            + '</td><td><button onclick="namespace_gui.remove_trade_row(this)" class="btn btn-default">Remove</button></td></tr>';
       return new_row;
    }

    function create_summary_row(obj)
    {
        var instrument = obj.symbol;       
        var position_type = "-";
        var type_dict = { "B":"Long", "S":"Short" }
        var split_index = obj.symbol.indexOf('_');
        if (split_index != -1)
        {
            var instrument = obj.symbol.substring(0, split_index);
            var position_type = type_dict[obj.symbol.substring(split_index+1)];
        }
        if (obj.pnl=='-') var cell_color ='';
        else if (obj.pnl>=0) var cell_color ='style="background-color:green;"';
        else var cell_color ='style="background-color:red;"';
        var summary_row = '<tr><td class="sum_asset">'+ instrument
            + '</td><td class="order_type">' + position_type
            + '</td><td class="sum_volume">'+ obj.volume
            + '<td class="avg_price">' + obj.price_avg
            + '</td><td class="sum_book_val">'+ obj.book_value
            + '<td class="sum_cur_val">' + obj.last_value
            + '</td><td class="sum_pnl "'+cell_color+'>'+obj.pnl
            + '</td></tr>';
        return summary_row;
     }

    function update_price_entry(p_symbol)
    {
        var xdate = datetime_util.adjust_date($("#date_entry").datepicker("getDate"));
        $.getJSON(API_URL, {instrument:p_symbol, call:"quote", datetime:xdate}, function(data)
        {
            if (data.header.error_code == 0)
                $("#price_entry").val(math_util.aux_math_round(data.contents.price,2));
            else 
                
                namespace_gui.send_log_message("Failed to load quote data, see raw responce data below", "System");           
                namespace_gui.send_log_message(data, "System");
        });
    }

    //dashboard_row = ...
    //apply colors to positive or negative values
    function create_dashboard_row(data_record)
    {
        function format_value_to_cell(p_val)
        {
            if (p_val<0) return '<td style="background-color:red">'+p_val+'</td>'
            else return '<td style="background-color:green">'+p_val+'</td>'
        }
        //else if (obj.pnl>=0) var cell_color ='style="background-color:green;"';
       // else var cell_color ='style="background-color:red;"';
        
        var dashboard_row = '<tr><td>'+data_record.asset + '</td>'
            + '<td>'+data_record.info + '</td>'
            + format_value_to_cell(data_record.portfolio_returns.ret_1d)
            + format_value_to_cell(data_record.portfolio_returns.ret_1w)
            + format_value_to_cell(data_record.portfolio_returns.ret_1m)
            + format_value_to_cell(data_record.portfolio_returns.ret_3m)
            + format_value_to_cell(data_record.portfolio_returns.ret_6m)
            + format_value_to_cell(data_record.portfolio_returns.ret_1y)
            + '<td>'+data_record.portfolio_momentum.p_200d +'</td>'
            + '<td>'+data_record.portfolio_momentum.p_50d +'</td>';
        return dashboard_row;
    }

    function safe_get_integer(p_unsafe_value)
    {
        return parseInt(p_unsafe_value);
    }

    function update_derived_value_tabs(p_client_report, p_benchmark_report)
    {
        $("#portfolio_net_pnl").text(p_client_report.diff_percent+"%");
        $("#portfolio_value").text(p_client_report.value_start+"%");
        $("#benchmark_value").text(p_benchmark_report.value_start+"%");
        $("#portfolio_final_pv").text(p_client_report.value_end+"%");
        $("#benchmark_final_pv").text(p_benchmark_report.value_end+"%");
        $("#benchmark_net_pnl").text(p_benchmark_report.diff_percent+"%");
        $("#portfolio_annualized").text(p_client_report.annualized+"%");
        $("#benchmark_annualized").text(p_benchmark_report.annualized+"%");
        $("#portfolio_std").text(p_client_report.std_dev+"%");
        $("#benchmark_std").text(p_benchmark_report.std_dev+"%");
        $("#portfolio_beta").text("0.0");//p_client_report.beta);
        $("#benchmark_beta").text("-");
        $("#portfolio_jensen_alpha").text("0.0");
        $("#benchmark_jensen_alpha").text("0.0");
        $("#portfolio_treynor").text("0.0");
        $("#benchmark_treynor").text("0.0");
        $("#portfolio_sharpe").text("0.0");
        $("#benchmark_sharpe").text("0.0");
        var p1 = 0.95;
        var p_val = $("#value_totals").text();
        var a1 = $("#benchmark_annualized").text();
        var b1 = $("#benchmark_std").text();
        var a2 = $("#portfolio_annualized").text();
        var b2 = $("#portfolio_std").text();
        var c1 = parseFloat(a1.substring(0,a1.length - 1));
        var d1 = parseFloat(b1.substring(0,b1.length - 1));
        var c2 = parseFloat(a2.substring(0,a2.length - 1));
        var d2 = parseFloat(b2.substring(0,b2.length - 1));
        var vatr1 = math_util.aux_math_round(namespace_xls.norminv(p1,c1,d1),2);
        var vatr2 = math_util.aux_math_round(namespace_xls.norminv(p1,c2,d2),2);
        var vatr1_abs = math_util.aux_math_round(p_val*vatr1/100.0,2);
        var vatr2_abs = math_util.aux_math_round(p_val*vatr2/100.0,2);
        $("#benchmark_vatr_pc").text(vatr1);
        $("#portfolio_vatr_pc").text(vatr2);
        $("#portfolio_vatr_abs").text(vatr2_abs);
        $("#benchmark_vatr_abs").text(vatr1_abs);
    }

    function format_flag_data(groups)
    {
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
    
        var flag_data = [];
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

    /* Public Interface */ 
    return {
        get_start_date : function ()
        {
            if (m_start_date !=undefined ) return m_start_date;
            else datetime_util.adjust_date(new Date(50, 0, 1));
        },
        update_charts: function(p_chart_data)
        {
            //update local data
            m_start_date = p_chart_data.transactions[0].book_date;
            portfolio_chart_data = p_chart_data.portfolio_series;
            m_benchmark_data = p_chart_data.m_benchmark_series;
            //update charts for portfolio only
            namespace_gui.refresh_val_pnl_chart();
            namespace_gui.refresh_sector_chart();
            //update_charts for portfolio + benchmarks
            namespace_gui.refresh_performance_chart_and_tab();
            namespace_gui.refresh_risk_chart();
        },
        
        refresh_val_pnl_chart: function ()
        {
            var display_mode = $("#perf_select").val();
            var flag_mode = $("#flags_selected").prop("checked");
            var chart_mode = $("#chart_select").val();
            if (!flag_mode)
            {
                $("#detail_cell").empty();
            }
            if (chart_mode == "pnl_chart")
            {
                if (display_mode == "absolute")
                    var series_data = portfolio_chart_data["pnl_series"];
                if (display_mode == "percent")
                    var series_data = portfolio_chart_data["norm_pnl_series"];
            }
            if (chart_mode == "val_chart")
            {
                if (display_mode == "absolute")
                    var series_data = portfolio_chart_data["value_series"];
                if (display_mode == "percent")
                    var series_data = portfolio_chart_data["norm_value_series"];
            }
            var flags = format_flag_data(portfolio_chart_data["transaction_clusters"]); 
            namespace_graphs.render_val_pnl_chart(series_data, "#container_chart1", display_mode, flag_mode, chart_mode, flags);
            namespace_gui.refresh_position_chart();
            //workaround to allow the chart match container size
            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                namespace_graphs.render_val_pnl_chart(series_data, "#container_chart1", display_mode, flag_mode, chart_mode, flags);
          });
        },
        
        refresh_position_chart: function()
        {
            var display_mode = $("#perf_select").val();
            namespace_graphs.render_position_chart(portfolio_chart_data["position_chart_data"], "#container_chart2b", display_mode);
            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
             namespace_graphs.render_position_chart(portfolio_chart_data["position_chart_data"], "#container_chart2b", display_mode);
          }); 
        }, 

        refresh_sector_chart: function()
        {
            namespace_graphs.render_sector_chart(portfolio_chart_data["sector_chart_data"], "#container_chart0");
        },

        refresh_performance_chart_and_tab: function()
        {
            var series_data = [{name:'Portfolio',data:portfolio_chart_data["norm_pnl_series"], type:'line'}];
            var current_benchmark = $("#benchmark_list :selected").text();
            for (var k in m_benchmark_data)
            {
                if (m_benchmark_data.hasOwnProperty(k))
                {
                    if (k == current_benchmark){
                        series_data.push({name: k, data:m_benchmark_data[k]["norm_value_series"], type:'line'});
                        update_derived_value_tabs(portfolio_chart_data["derived_values"],m_benchmark_data[k]["derived_values"]);
                        }
                }
            }
            namespace_graphs.render_performance_chart(series_data, "#container_chart3");
        },

        refresh_risk_chart: function()
        {
            var current_benchmark = $("#benchmark_list :selected").text();
            //select benchmark from the list
            for (var k in m_benchmark_data)
            {
                if (m_benchmark_data.hasOwnProperty(k))
                {
                    if (k == current_benchmark)
                    {    
                        series_data = m_benchmark_data[k]["risk_chart_data"];
                        namespace_graphs.render_risk_chart_group(portfolio_chart_data["risk_chart_data"], series_data, "#container_chart4");
                    }
                }
            }
        },

        //analytics
        render_derived: function(derived_data)
        {
        },

        render_portfolio_dashboard: function(dashboard_data)
        {
            $("#dashboard_rows").empty();
            for (var i=0; i<dashboard_data.length; i++)
            {
                $("#dashboard_rows").append(create_dashboard_row(dashboard_data[i]));          
            }
        },
        //dashboard values for portfolio and benchmark
        append_dashboard_row: function(dashboard_data)
        {
            for (var i=0; i<dashboard_data.length; i++)
            {
                $("#reference_rows").append(create_dashboard_row(dashboard_data[i]));          
            }
            //update charts (performance, risk, bubble, risk percentage etc)
        },

        render_tables: function(net_data, transactions)
        {
            //render trades
            $("#matrix").empty();
            for (var i=0; i <transactions.length; i++) 
            {
                $("#matrix").append(create_transaction_row(transactions[i]));
            }
            $("#net_rows").empty();
            //append cash row first and net values
            $("#net_rows").append(create_summary_row({"symbol": "Cash", 
                                           "volume": "-", 
                                           "price_avg": "-",
                                           "book_value":net_data.net_cash_row.start_cash,
                                           "last_value":net_data.net_cash_row.total_cash, 
                                           "pnl": net_data.net_cash_row.cash_change}));
            //append net positions
            var net_rows = net_data.positions;
            for (var x in net_rows)
            {
                if (net_rows.hasOwnProperty(x))
                    $("#net_rows").append(create_summary_row(net_rows[x]));      
            } 
            
            $("#value_totals").text(net_data.total_value);
            $("#pnl_totals").text(net_data.total_pnl);
            if (net_data.total_pnl >=0)  $("#pnl_totals").css( "background-color","green");
            else  $("#pnl_totals").css( "background-color","red");  
        },
    
        /* Initialize user interface elements */
        init_page: function(page_state)
        {
            /* create GUI objects */            
            $("#portfolio_date").datepicker();
                
            /* Populate them with data */
            $("#instrument_entry").autocomplete({
                source:page_state.list_instruments,
                select: function(event, ui) {
                    var tdate = $("#date_entry").datepicker("getDate");
                    var symbol = ui.item.value;
                    if (tdate!=null) update_price_entry(symbol);
                } 
            });
            $("#benchmark_entry").autocomplete({
                source:page_state.list_benchmarks
            });


            /* init instrument entry datetime picker" */
            $("#date_entry").datepicker({
                onSelect: function(dateText, inst) {
                    var symbol = $("#instrument_entry").val();
                    update_price_entry(symbol);
                }
            });

            var portfolio_defaults = {"risk_interval": safe_get_integer($("#range_select").val()) };
            namespace_portfolio.load_portfolio_defaults(portfolio_defaults); 
        },
        
        deposit_cash: function()
        {
            var new_transaction = {
                volume: $("#portfolio_cash").val(),
                book_date: datetime_util.adjust_date($("#portfolio_date").datepicker("getDate")),
                type: "Deposit",
                asset: "Cash",
                sector: "-",
                book_price: 1.0,
                last_price: 1.0
            };
            namespace_portfolio.update_state("add_record", new_transaction);
        },

        remove_cash: function()
        {
            var new_transaction = {
                volume: $("#portfolio_cash").val(),
                book_date: datetime_util.adjust_date($("#portfolio_date").datepicker("getDate")),
                type: "Withdraw",
                asset: "Cash",
                sector: "-",
                book_price: 1.0,
                last_price: 1.0
            };
            namespace_portfolio.update_state("add_record", new_transaction);
        },
        

        add_trade_row: function()
        {
            var new_transaction = {
                volume: $("#amount_entry").val(),
                book_date: datetime_util.adjust_date($("#date_entry").datepicker("getDate")),
                type: $("#trade_type").val(),
                asset: $("#instrument_entry").val(),
                sector: undefined,
                book_price: $("#price_entry").val(),
                last_price: undefined,
            };
            namespace_portfolio.update_state("add_record", new_transaction);
        },
        
        remove_trade_row: function(node)
        {
            var tr_id = node.parentNode.parentNode.id;
            namespace_portfolio.update_state("remove_record", tr_id);
        },
        
        add_dashboard_benchmark_row: function()
        {
            var new_benchmark = $("#benchmark_entry").val();
            //now update the dropdown list
            namespace_portfolio.update_state("add_dashboard_benchmark", new_benchmark);
        },
    
        update_benchmark_selector: function(p_benchmark)
        {
            $("#benchmark_list").append('<option value=1>'+p_benchmark+'</option>');

        },
 
        send_log_message: function(message, p_severity)
        {
            //... with fall-through!
            switch(p_severity)
            {
                case "User":
                    alert(message);
                default:
                    console.log(message);
            }
        }
    };
}) ();

