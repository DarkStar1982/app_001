/* ENTRY POINT */
$(document).ready(function(){
    /* Initialize */
    namespace_portfolio.initialize();
    /* bind event handlers */
    $("#cash_add").on('click', namespace_gui.deposit_cash);
    $("#transaction_add").on('click', namespace_gui.add_trade_row);
    $("#benchmark_add").on('click', namespace_gui.add_dashboard_benchmark_row);
    $("#perf_select").on('change', namespace_gui.refresh_val_pnl_chart);
    $("#chart_select").on('change', namespace_gui.refresh_val_pnl_chart);
});

/* GUI ACTIONS  interactions code */
var namespace_gui = (function() {
    // PRIVATE DATA
    var API_URL = "/data_api/:2000";
    var portfolio_chart_data = {};

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
            + '</td><td><button onclick="namespace_gui.remove_trade_row(this)" class="btn">Remove</button></td></tr>';
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
        var summary_row = '<tr><td class="sum_asset">'+ instrument
            + '</td><td class="order_type">' + position_type
            + '</td><td class="sum_volume">'+ obj.volume
            + '<td class="avg_price">' + obj.price_avg
            + '</td><td class="sum_book_val">'+ obj.book_value
            + '<td class="sum_cur_val">' + obj.last_value
            + '</td><td class="sum_pnl">'+obj.pnl
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
    function create_dashboard_row(data_record)
    {
        var dashboard_row = '<tr><td>'+data_record.asset + '</td>'
            + '<td>'+data_record.info + '</td>'
            + '<td>'+data_record.portfolio_returns.ret_1d+'</td>'
            + '<td>'+data_record.portfolio_returns.ret_1w+'</td>'
            + '<td>'+data_record.portfolio_returns.ret_1m+'</td>'
            + '<td>'+data_record.portfolio_returns.ret_3m+'</td>'
            + '<td>'+data_record.portfolio_returns.ret_6m+'</td>'
            + '<td>'+data_record.portfolio_returns.ret_1y+'</td>'
            + '<td>'+data_record.portfolio_momentum.p_200d+'</td>'
            + '<td>'+data_record.portfolio_momentum.p_50d +'</td>';
        return dashboard_row;
    }

    function safe_get_integer(p_unsafe_value)
    {
        return parseInt(p_unsafe_value);
    }

    /* Public Interface */ 
    return {
        update_charts: function(p_chart_data)
        {
            //update local data
            portfolio_chart_data = p_chart_data.portfolio_series;
            m_benchmark_data = p_chart_data.m_benchmark_series;
            //update charts for portfolio only
            namespace_gui.refresh_val_pnl_chart();
            namespace_gui.refresh_position_chart();
            namespace_gui.refresh_sector_chart();
            //update_charts for portfolio + benchmarks
            namespace_gui.refresh_performance_chart();
            namespace_gui.refresh_risk_chart();
        },
        
        refresh_val_pnl_chart: function ()
        {
            var display_mode = $("#perf_select").val();
            var flag_mode = $("#flags_selected").prop("checked");
            var chart_mode = $("#chart_select").val();
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
            namespace_graphs.render_val_pnl_chart(series_data, "#container_chart1", display_mode, flag_mode, chart_mode);
        },

        refresh_position_chart: function()
        {
            namespace_graphs.render_position_chart(portfolio_chart_data["position_chart_data"], "#container_chart2b");
        }, 

        refresh_sector_chart: function()
        {
            namespace_graphs.render_sector_chart(portfolio_chart_data["sector_chart_data"], "#container_chart0");
        },

        refresh_performance_chart: function()
        {
            var series_data = [{name:'Portfolio',data:portfolio_chart_data["norm_pnl_series"], type:'line'}];
            for (var k in m_benchmark_data)
            {
                if (m_benchmark_data.hasOwnProperty(k))
                {
                    series_data.push({name: k, data:m_benchmark_data[k]["norm_value_series"], type:'line'});
                }
            }
            namespace_graphs.render_performance_chart(series_data, "#container_chart3");
        },

        refresh_risk_chart: function()
        {
            //modify
            namespace_graphs.render_risk_chart(portfolio_chart_data["risk_series"], "#container_chart4");
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
            
            //render charts and dashboard
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
            namespace_portfolio.update_state("add_dashboard_benchmark", new_benchmark);
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

