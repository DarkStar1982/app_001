/* ENTRY POINT */
$(document).ready(function(){
    /* Initialize */
    namespace_portfolio.initialize();
    /* bind event handlers */
    $("#cash_add").on('click', namespace_gui.deposit_cash);
    $("#cash_remove").on('click', namespace_gui.remove_cash);
    $("#transaction_add").on('click', namespace_gui.add_trade_row);
    $("#benchmark_add").on('click', namespace_gui.add_dashboard_benchmark_row);
    $("#clear_benchmarks").on('click', namespace_gui.clear_dashboard_benchmarks);
    $("#perf_select").on('change', namespace_gui.refresh_val_pnl_chart);
    $("#chart_select").on('change', namespace_gui.refresh_val_pnl_chart);
    $("#benchmark_list").on('change', namespace_gui.refresh_performance_chart_and_tab);
    $("#flags_selected").on('change', namespace_gui.refresh_val_pnl_chart);
    $("#submitFile").on('click', namespace_gui.process_transactions_file);
    $("#get_pdf_report").on('submit', namespace_gui.get_pdf_report);
	$(".navbar-brand").on('click', function(){
	    $(".nav li").removeClass('active');
	    $(this).addClass('active');
	})
    /*  make the page */
    namespace_gui.set_visibility(0);
});

/* GUI ACTIONS  interactions code */
var namespace_gui = (function() {
    // PRIVATE DATA
    var API_URL = "/data_api";
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
        var xdate = $("#portfolio_date").val();
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
        $("#portfolio_net_pnl").text(math_util.aux_math_round(p_client_report.diff_percent,2)+"%");
        $("#portfolio_value").text(p_client_report.value_start+"%");
        $("#benchmark_value").text(p_benchmark_report.value_start+"%");
        $("#portfolio_final_pv").text(math_util.aux_math_round(p_client_report.value_end,2)+"%");
        $("#benchmark_final_pv").text(math_util.aux_math_round(p_benchmark_report.value_end,2)+"%");
        $("#benchmark_net_pnl").text(math_util.aux_math_round(p_benchmark_report.diff_percent,2)+"%");
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
            var row_id = this.title;
            $('#detail_cell tr').css( "background-color", 'rgba(0,0,0,0)');
            $('[id^=h'+String(row_id)+']').css( "background-color", "red" );
        }
    
        var flag_data = [];
        for (var i=0; i<groups.length; i++)
        {
            flag_data[i] = new Object();
            var x_date = groups[i].start_date;
            flag_data[i].x = x_date;
            flag_data[i].title=i;
            flag_data[i].events = { "click" : flag_click};
        }
        return flag_data;
    }

    function render_flags_on_sidebar(p_flags)
    {
        var list_str=[];
        for (var i=0; i<p_flags.length; i++)
        {
            //for each transaction group
            if (p_flags[i]["transactions"].length == 1)
            {
                list_str.push('<tr id="h'+String(i)+'1"><td>' + datetime_util.adjust_date(p_flags[i]["start_date"]) + "</td>"
                    +"<td>" + p_flags[i]["transactions"][0]["symbol"] + ", "
                        + p_flags[i]["transactions"][0]["volume"] + ", "
                        + p_flags[i]["transactions"][0]["action"] + ", "
                        + p_flags[i]["transactions"][0]["price"]
                    +"</td></tr>");
            }
            else if (p_flags[i]["transactions"].length>1)
            {
                list_str.push('<tr id="h'+String(i)+'0"><td>' + datetime_util.adjust_date(p_flags[i]["start_date"]) + "</td>"
                    +"<td>" + p_flags[i]["transactions"][0]["symbol"] + ", "
                        + p_flags[i]["transactions"][0]["volume"] + ", "
                        + p_flags[i]["transactions"][0]["action"] + ", "
                        + p_flags[i]["transactions"][0]["price"]
                    +"</td></tr>");
                for (var k = 1; k<p_flags[i]["transactions"].length;k++)
                {
                    if (k==1)
                    {
                        list_str.push('<tr id="h'+String(i)+'1"><td rowspan="'+String(p_flags[i].transactions.length-1)+'">' 
                            + datetime_util.adjust_date(p_flags[i]["end_date"]) + "</td>"
                            + "<td>" + p_flags[i]["transactions"][k]["symbol"] + ", "
                            + p_flags[i]["transactions"][k]["volume"] + ", "
                            + p_flags[i]["transactions"][k]["action"] + ", "
                            + p_flags[i]["transactions"][k]["price"]
                        +"</td></tr>");
                    }
                    else if (k>1)
                    {
                        list_str.push('<tr id="h'+String(i)+String(k)+'"><td>' + p_flags[i]["transactions"][k]["symbol"] + ", "
                            + p_flags[i]["transactions"][k]["volume"] + ", "
                            + p_flags[i]["transactions"][k]["action"] + ", "
                            + p_flags[i]["transactions"][k]["price"]
                        +"</td></tr>");
                    }
                }
            }
            //now append the details
            $("#detail_cell").empty();
            for (var j=0;j<list_str.length;j++)
            {
                $("#detail_cell").append(list_str[j]);
            }
        }
    }

    function process_row_list(p_row_data)
    {
         var transformed = JSON.parse(p_row_data);
         for (var i=0; i<transformed.length; i++)
         {
            var new_transaction = {
                volume: transformed[i].Volume,
                book_date: transformed[i].Date,
                type: transformed[i].BuySell,
                asset: transformed[i].Asset,
                sector: undefined,
                book_price: transformed[i].BookPrice,
                last_price: undefined,
            };
			//correct Deposit and Withdraw ones
		 	if ((transformed[i].BuySell == "Deposit") || (transformed[i].BuySell == "Withdraw"))
			{
				new_transaction["last_price"] = 1.0;
				new_transaction["sector"] = '-';
			} 

			
            namespace_portfolio.update_state("add_record", new_transaction);
        }
    }
    /* Public Interface */ 
    return {

		get_pdf_report: function()
		{
			//alert("TEST");
		    var allVals = [];
			$('#report_selector :checked').each(function() {
				allVals.push($(this).val());
			});
			var data=JSON.stringify(namespace_portfolio.generate_pdf_report(allVals));
			var input = $("<input>").attr("type", "hidden").attr("name", "data").val(data);
			$('#get_pdf_report').append($(input));
		},
		
        process_transactions_file: function()
        {
            $.ajax({
                    url: "upload/",
                    type: "POST",
                    contentType: false,
                    processData: false,
                    data: function() {
                        var data = new FormData();
                        //  data.append("fileDescription", jQuery("#desc").val());
                        data.append("chosenFile", $("#chosenFile").get(0).files[0]);
                        return data;
                        // Or simply return new FormData(jQuery("form")[0]);
                    }(),
                    error: function(_, textStatus, errorThrown) {
                        alert("Error uploading file :: "+errorThrown);
                        console.log(textStatus, errorThrown);
                    },
                    success: function(response, textStatus) {
                        process_row_list(response);
                    }
                });
        },

        get_start_date : function ()
        {
            if (m_start_date !=undefined ) return m_start_date;
            else datetime_util.adjust_date(new Date(50, 0, 1));
        },

        update_charts: function(p_data)
        {
            //update local data
            m_start_date = p_data.transactions[0].book_date;
            portfolio_chart_data = p_data.portfolio_series;
            m_benchmark_data = p_data.m_benchmark_series;
            //update charts for portfolio only
            namespace_gui.refresh_val_pnl_chart();
            namespace_gui.refresh_sector_chart();
            //update_charts for portfolio + benchmarks
			if (''!=$("#benchmark_list :selected").text())
			{
				namespace_gui.refresh_performance_chart_and_tab();
           		//namespace_gui.refresh_risk_chart(0);
			}
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
            //var flags = get_flag_markers()
            render_flags_on_sidebar(portfolio_chart_data["transaction_clusters"]);
            namespace_graphs.render_val_pnl_chart(series_data, "#container_chart1", display_mode, flag_mode, chart_mode, flags);
            namespace_graphs.render_position_chart(portfolio_chart_data["position_chart_data"], "#container_chart2b", display_mode);
            //workaround to allow the chart match container size
            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                render_flags_on_sidebar(portfolio_chart_data["transaction_clusters"]);
                namespace_graphs.render_val_pnl_chart(series_data, "#container_chart1", display_mode, flag_mode, chart_mode, flags);
                namespace_graphs.render_position_chart(portfolio_chart_data["position_chart_data"], "#container_chart2b", display_mode);
          });
        },
        

        refresh_sector_chart: function()
        {
            namespace_graphs.render_sector_chart(portfolio_chart_data["sector_chart_data"], "#container_chart0");
        },

        refresh_performance_chart_and_tab: function()
        {
            var series_data = [{
                name:'Portfolio',
                data: portfolio_chart_data["norm_pnl_series"], 
                type:'line'
            }];
            var current_benchmark = $("#benchmark_list :selected").text();
            for (var k in m_benchmark_data)
            {
                if (m_benchmark_data.hasOwnProperty(k))
                {
                    if (k == current_benchmark){
                        series_data.push({
							name: k, 
							data:m_benchmark_data[k]["norm_value_series"], 
							type:'line',
							dashStyle: 'dot'
						});
                        update_derived_value_tabs(portfolio_chart_data["derived_values"],m_benchmark_data[k]["derived_values"]);
                        }
                }
            }
            namespace_graphs.render_performance_chart(series_data, "#container_chart3");
            namespace_gui.refresh_risk_chart(0);
        },

        refresh_risk_chart: function(render_mode)
        {
			var rank_mode = 0;
            var current_benchmark = $("#benchmark_list :selected").text();
            for (var k in m_benchmark_data)
            {
                if (m_benchmark_data.hasOwnProperty(k))
                {
                    if (k == current_benchmark)
                    {    
                        benchmark_series_data = m_benchmark_data[k]["risk_chart_data"];
                        benchmark_derived_data = m_benchmark_data[k]["derived_values"]
                        namespace_graphs.render_risk_chart_group(portfolio_chart_data["risk_chart_data"], 
                                                                 portfolio_chart_data["derived_values"],
                                                                 benchmark_series_data, 
                                                                 benchmark_derived_data,
                                                                 "#container_chart4",
                                                                 rank_mode,
                                                                 render_mode);
                    }
                }
            } 
            /*
            */ 
        },

        //analytics
        render_derived: function(derived_data)
        {
			// TODO
        },

        set_visibility: function(p_level)
        {
            //0 hide all but the positions
            if (p_level == 0) 
            {
                $("#tab_container3").hide();
                $("#tab_container4").hide();
                $("#tab_container5").hide(); 
                $("#tab_container6").hide(); 
            }
            else if (p_level == 1)
            {
                $("#tab_container3").show();
                $("#tab_container4").show();
            }
            else if (p_level == 2)
            {
                $("#tab_container5").show(); 
                $("#tab_container6").show(); 
            }
            else if (p_level == 3)
            {
                $("#tab_container5").hide();
                $("#tab_container6").hide();
            } 
        },

        render_portfolio_dashboard: function(dashboard_data)
        {
            $("#dashboard_rows").empty();
			var dashboard_table = "";
            for (var i=0; i<dashboard_data.length; i++)
            {
				dashboard_table = dashboard_table + create_dashboard_row(dashboard_data[i]);
            }
            $("#dashboard_rows").append(dashboard_table)          
        },
        //dashboard values for portfolio and benchmark
        append_dashboard_row: function(dashboard_data)
        {
			var reference_table = "";
            for (var i=0; i<dashboard_data.length; i++)
            {
				reference_table = reference_table + create_dashboard_row(dashboard_data[i]);
            }
            $("#reference_rows").append(reference_table);          
			
            //update charts (performance, risk, bubble, risk percentage etc)
        },

        render_tables: function(net_data, transactions)
        {
            //render trades
            $("#matrix").empty();
			var table_rows ="";
            for (var i=0; i <transactions.length; i++) 
            {
				table_rows = table_rows + create_transaction_row(transactions[i]);
            }
			$("#matrix").append(table_rows);
            $("#net_rows").empty();
            //append cash row first and net values
            var table_net_rows = create_summary_row({"symbol": "Cash", 
                                           "volume": "-", 
                                           "price_avg": "-",
                                           "book_value":net_data.net_cash_row.start_cash,
                                           "last_value":net_data.net_cash_row.total_cash, 
                                           "pnl": net_data.net_cash_row.cash_change});
            //append net positions
            var net_rows = net_data.positions;
            for (var x in net_rows)
            {
                if (net_rows.hasOwnProperty(x))
					table_net_rows = table_net_rows + create_summary_row(net_rows[x]);
            } 
            $("#net_rows").append(table_net_rows);      
            $("#value_totals").text(net_data.total_value);
            $("#pnl_totals").text(net_data.total_pnl);
			if (net_data.total_pnl == '-')
			{}
            else {
					if (net_data.total_pnl >=0)  
						$("#pnl_totals").css( "background-color","green");
            		else  $("#pnl_totals").css( "background-color","red");  
				}
        },
    
        /* Initialize user interface elements */
        init_page: function(page_state)
        {
            /* create GUI objects */            
            //$("#portfolio_date").datepicker();
                
            /* Populate them with data */
            $("#instrument_entry").autocomplete({
                source:page_state.list_instruments,
                select: function(event, ui) {
                    var tdate = $("#portfolio_date").val();
                    var symbol = ui.item.value;
                    if (tdate!=null) update_price_entry(symbol);
                } 
            });
            $("#benchmark_entry").autocomplete({
                source:page_state.list_benchmarks
            });


            /* init instrument entry datetime picker" 
            $("#date_entry").datepicker({
                onSelect: function(dateText, inst) {
                    var symbol = $("#instrument_entry").val();
                    update_price_entry(symbol);
                }
            }); */

            var portfolio_defaults = {"risk_interval": safe_get_integer($("#range_select").val()) };
            namespace_portfolio.load_portfolio_defaults(portfolio_defaults); 
        },
        
        deposit_cash: function()
        {
            var new_transaction = {
                volume: $("#portfolio_cash").val(),
                book_date: $("#portfolio_date").val(),
                type: "Deposit",
                asset: "Cash",
                sector: "-",
                book_price: 1.0,
                last_price: 1.0
            };
            //$("#date_entry").datepicker("setDate",$("#portfolio_date").datepicker("getDate"));
            namespace_portfolio.update_state("add_record", new_transaction);
        },

        remove_cash: function()
        {
            var new_transaction = {
                volume: $("#portfolio_cash").val(),
                book_date: $("#portfolio_date").val(),
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
                book_date: $("#portfolio_date").val(),
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
  
        clear_dashboard_benchmark_rows: function()
        {
            $("#reference_rows").empty();
        },
 
        clear_dashboard_benchmarks: function ()
        {
            namespace_portfolio.update_state("clear_dashboard_benchmarks");
        },
 
        update_benchmark_selector: function(p_benchmark)
        {
            $("#benchmark_list").append('<option value=1>'+p_benchmark+'</option>');
        },

        clear_benchmark_selector: function()
        {
            $("#benchmark_list").empty();
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

