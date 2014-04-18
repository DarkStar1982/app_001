var namespace_ui = (function () {
	/*** public ***/
	return {
		transform_to_csv : function (p_obj_dat)
		{
        		var xsummary = "";
        		for (var i=0;i<p_obj_tlist.length;i++)
        		{
                		var csvline="";
                		csvline = p_obj_tlist[i].volume + "," + p_obj_tlist[i].symbol + ","
                                	+ p_obj_tlist[i].type + "," + p_obj_tlist[i].b_date + "," + p_obj_tlist[i].b_price + ","
                                	+ p_obj_tlist[i].c_price;
                		xsummary = xsummary + csvline +'|';
        		}
        		//remove trailing '|'
			xsummary = xsummary.slice(0,-1);
			return xsummary;
                },
		create_benchmark_data: function(p_start_date)
        	{
                	var name_select = $("#benchmark_list").val();
                	if (name_select.search('500')!=-1)
                        	var symbol = '^GSPC';
                	else if (name_select.search('NASDAQ')!=-1)
                        	var symbol = '^IXIC';
                	else symbol='';
                	var value = '1';
                	var price = '1.0';
                	var csvline="";
                	csvline = "1" + "," + symbol+ "," +"Buy" + "," + p_start_date + ","+ '1.0' + ","+ '1,0';
                	return csvline
        	},

		create_table_row: function (p_id,p_asset,p_sector,p_buysell,p_vol,p_date,p_book_price,p_cur_price)
		{
			var new_row = '<tr id="'+p_id+'"><td class="asset_name">'+ p_asset
                	+ '</td><td class="sector_label">' + p_sector 
                	+ '</td><td class="buysell_label">' + p_buysell
                	+ '</td><td class="volume_label">'+ p_vol
                	+ '</td><td class="book_date">' + p_date
                	+ '</td><td class="book_price">' + p_book_price
                	+ '</td><td class="current_price">'+ p_cur_price
                	+ '</td><td><button onclick="remove_row_action(this)" class="btn">Remove</button></td></tr>';
			return new_row;
		},
		create_dashboard_row: function(p_asset, p_sector, p_returns, p_momentum)
		{
			var dash_row = '<tr><td>'+ p_asset
                	+ '</td><td>' + p_sector 
                	+ '</td><td>' + p_returns.ret_1d
                	+ '</td><td>' + p_returns.ret_1w
                	+ '</td><td>' + p_returns.ret_1m 
                	+ '</td><td>' + p_returns.ret_3m
			+ '</td><td>' + p_returns.ret_6m
			+ '</td><td>' + p_returns.ret_1y
			+ '</td><td>' + p_momentum.m_50d
			+ '</td><td>' + p_momentum.m_200d
                	+ '</td></tr>';
			return dash_row;
		},
        	create_summary_row: function(p_asset, p_vol, p_avgprice, p_book_val, p_cur_val, p_pnl)
        	{
                	var x = p_asset.indexOf('_');
                	var position = '-';
                	var true_symbol;
			var pnl_color = "";
			if (p_pnl>0) 
				pnl_color = "green";
			else
				pnl_color = "red";
                	if (x != -1)
			{
                        	true_symbol = p_asset.substring(0,x);
                        	position = p_asset.substring(x+1);
                        	if (position=='B') position = "Long";
                        	if (position=='S') position = "Short";
                	}
                	else
                	{
                        	true_symbol = p_asset;
                	}
                	var sum_row = '<tr><td class="sum_asset">'+ true_symbol
               		+ '</td><td class="order_type">' + position
                	+ '</td><td class="sum_volume">'+ p_vol
                	+ '<td class="avg_price">' + p_avgprice
                	+ '</td><td class="sum_book_val">'+ p_book_val
                	+ '<td class="sum_cur_val">' + p_cur_val
                	+ '</td><td class="sum_pnl"><font color='+pnl_color+'>'+ p_pnl+"</font>"
                	+ '</td></tr>';
                	return sum_row;
        	},

		set_visibility: function(p_value)
        	{
                	if (p_value)
                	{
                        	$("#container_chart0").show();
                        	$("#container_chart1").show();
                        	$("#container_chart2").show();
                        	$("#container_chart2b").show();
                        	$("#container_chart3").show();
                        	$("#container_chart4").show();
                        	$("#container_report").show();
                        	$("#benchmark_list").show();
                        	$("#last_header").show();
                        	$("#step3").show();
                        	$("#perf_select").show();
                        	$("#summary_table").show();
                        	$("#net_values").show();
                        	$("#step4").show();
                        	$("#step4x1").show();
                        	$("#step4x2").show();
                        	$("#step5").show();
                        	$("#step6").show();
                        	$("#step7").show();
                        	$("#net_sums").show();
                        	$("#risk_info").show();
                        	$("#cash_remove").show();
			}
			else
                	{
                        	$("#container_chart0").hide();
                        	$("#container_chart1").hide();
                        	$("#container_chart2b").hide();
                        	$("#container_chart2").hide();
                        	$("#container_chart3").hide();
                        	$("#container_chart4").hide();
                        	$("#container_report").hide();
                        	$("#benchmark_list").hide();
                        	$("#last_header").hide();
                        	$("#step3").hide();
                        	$("#perf_select").hide();
                        	$("#summary_table").hide();
                        	$("#net_values").hide();
                        	$("#step4").hide();
                        	$("#step4x1").hide();
                        	$("#step4x2").hide();
                        	$("#step5").hide();
                        	$("#step6").hide();
                        	$("#step7").hide();
                        	$("#net_sums").hide();
                        	$("#risk_info").hide();
                        	$("#cash_remove").hide();
                	}
                },

	        get_cash_position_index: function()
        	{
                	var nrows = $("#matrix").children("tr");
                	var nindex=-1;
                	nrows.each(function(index){
                        	var val=$(this).children(".asset_name").text();
                        	if (val=="Cash") {
                                	nindex=index;
                        	}
                	});
                	return nindex;
        	},

		get_portfolio_transactions: function()
		{
        		var tr_list = new Array();
        		var i = 0;
        		var prows=$("#matrix").children("tr");
        		prows.each(function (index){
                		var p_item = new Object();
                		p_item.symbol = $(this).children(".asset_name").text();
                		p_item.sector = $(this).children(".sector_label").text();
                		p_item.volume = $(this).children(".volume_label").text();
                		p_item.type = $(this).children(".buysell_label").text();
                		p_item.b_price = $(this).children(".book_price").text();
                		p_item.c_price = $(this).children(".current_price").text()
                		p_item.b_date = $(this).children(".book_date").text();
                		tr_list[i] = p_item;
                		i++;
        		});
			//sort by date
        		tr_list.sort(function (a,b){
                		if (a.b_date > b.b_date)
                        		return 1;
                		if (a.b_date < b.b_date)
                        		return -1;
                		return 0;
        		});
        		return tr_list;
		},

		update_net_reports: function(p_client_report, p_benchmark_report)
        	{
                	$("#portfolio_net_pnl").text(p_client_report.percent_pnl+"%");
                	$("#portfolio_value").text(p_client_report.percent_start+"%");
               		$("#benchmark_value").text(p_benchmark_report.percent_start+"%");
                	$("#portfolio_final_pv").text(p_client_report.percent_end+"%");
                	$("#benchmark_final_pv").text(p_benchmark_report.percent_end+"%");
                	$("#benchmark_net_pnl").text(p_benchmark_report.percent_pnl+"%");
                	$("#portfolio_annualized").text(p_client_report.annualized+"%");
                	$("#benchmark_annualized").text(p_benchmark_report.annualized+"%");
                	$("#portfolio_std").text(p_client_report.std_dev+"%");
                	$("#benchmark_std").text(p_benchmark_report.std_dev+"%");
                	$("#portfolio_beta").text(p_client_report.beta);
                	$("#benchmark_beta").text("-");
                	$("#portfolio_jensen_alpha").text("0.0");
                	$("#benchmark_jensen_alpha").text("0.0");
                	$("#portfolio_treynor").text("0.0");
                	$("#benchmark_treynor").text("0.0");
                	$("#portfolio_sharpe").text("0.0");
                	$("#benchmark_sharpe").text("0.0");
        	},
		
		render_net_positions: function(p_net_positions)
		{
        		$("#net_rows").empty();
        		for (var x in p_net_positions.positions)
	        	{
                		if (p_net_positions.positions.hasOwnProperty(x))
                		{
                        		var asset = p_net_positions.positions[x].symbol;
                        		var vol = p_net_positions.positions[x].volume;
                        		var price = p_net_positions.positions[x].avg_price;
                        		var book_val = p_net_positions.positions[x].book_val;
                        		var cur_val = p_net_positions.positions[x].cur_val;
                        		var pnl = p_net_positions.positions[x].pnl;
                        		var prow = namespace_ui.create_summary_row(asset, vol, price, book_val, cur_val, pnl);
                        		$("#net_rows").append(prow);
                		}
        		}
        		var c = p_net_positions.cash_net;
        		var crow = namespace_ui.create_summary_row('Cash', '-', '-',c.start_cash,c.total_cash, c.cash_change);
        		$("#net_rows").append(crow);
        		$("#value_totals").text(math_util.aux_currency_round(p_net_positions.total_val));
	        	$("#pnl_totals").text(math_util.aux_currency_round(p_net_positions.total_pnl));
		},
		render_dashboard: function(p_net_positions)
		{
			$("#dashboard_rows").empty();
			//var obj_returns = {ret_1d: 0.0, ret_1w : 1.0, ret_1m : 2.0, ret_3m : 3.0, ret_6m : 4.0, ret_1y: 5.0 }; 
			//var obj_momentum = {m_50d: 'TEST', m_200d: 'SO TEST'};
			//var drow = namespace_ui.create_dashboard_row('Test','Test',obj_returns,obj_momentum);
			//$("#dashboard_rows").append(drow);
			var raw_data = namespace_ui.get_portfolio_transactions();
        		var csv_summary = namespace_ui.transform_to_csv(raw_data);
			$.getJSON('data_api',{input_data:csv_summary,type:'value_profile',flags:'percent'},function(data){
				//compute the time returns and momentum for each position???
				//now create the rows and append
				//get aggregated portfolio value series
				//get 1d - 1y returns
				//	get start date, get end difference, see the difference
				//	input is [[date, value],...] array
				//	output is single value
				//for each position get 1d - 1y positions, weight adjusted
                	});	
			//$.getJSON('data_api', {input}
		},
		render_comparative_reports: function(p_net_data)
		{
			var portfolio_report = new Object();
		        var benchmark_report = new Object();
		        var xdate = $("#1").children(".book_date").text();
		        var end_totals = p_net_data.total_val;
        		var start_cash = p_net_data.cash_net.start_cash;
		        var xpnl = p_net_data.total_pnl;
		        var storage=new Array();
        		var raw_data = namespace_ui.get_portfolio_transactions();
        		var csv_summary = namespace_ui.transform_to_csv(raw_data);
        		$.getJSON('data_api',{input_data:csv_summary,type:'value_profile',flags:'percent'},function(data){
                		portfolio_report.percent_start = 100.0;
                		portfolio_report.percent_end = math_util.aux_currency_round(end_totals / start_cash * 100.0);
                		portfolio_report.percent_pnl = math_util.aux_currency_round((xpnl) / start_cash * 100.0);
                		portfolio_report.annualized = math_util.compute_annualized(portfolio_report.percent_pnl, xdate);
                		portfolio_report.std_dev = math_util.compute_stdev(data);
                		storage = data;
        		}).done( function (){
                		var benchmark = namespace_ui.create_benchmark_data(xdate);
                		$.getJSON('data_api',{input_data:benchmark,type:'value_profile',flags:'benchmark'},function(data){
                        		var last_e = data.pop();
                        		var last_val = last_e[1];
                        		benchmark_report.percent_end = math_util.aux_currency_round(last_val);
                        		benchmark_report.percent_start = 100.0;
                        		benchmark_report.percent_pnl = math_util.aux_currency_round(last_val - 100.0);
					var t_pnl = benchmark_report.percent_pnl; 
                        		benchmark_report.annualized = math_util.compute_annualized(t_pnl, xdate);
                        		benchmark_report.std_dev = math_util.compute_stdev(data);
                        		portfolio_report.beta = math_util.compute_beta(storage, data);
                        		namespace_ui.update_net_reports(portfolio_report, benchmark_report);
					namespace_ui.render_risk_report();
                		});
        		});
		},

		get_net_position_summary: function()
        	{
                	var list_positions=[];
                	var i=0;
                	var prows = $("#net_rows").children("tr");
                	prows.each(function(index){
                                var new_record={};
                                new_record.symbol = $(this).children(".sum_asset").text();
                                new_record.value = $(this).children(".sum_pnl").text();
                                new_record.volume = $(this).children(".sum_volume").text();
                                var end_val = $(this).children(".sum_cur_val").text();
                                var beg_val = $(this).children(".sum_book_val").text();
                                var xpnl = (parseFloat(end_val)/parseFloat(beg_val) - 1.0)*100.0;
                                new_record.xpnl = math_util.aux_currency_round(xpnl);
                                list_positions[i] = new_record;
                                i = i + 1;
                        });
                	return list_positions;
        	},

		render_risk_report: function()
		{
			//get variable values
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
			// get value at risk	
			var vatr1 = math_util.aux_math_round(namespace_xls.norminv(p1,c1,d1),2);
			var vatr2 = math_util.aux_math_round(namespace_xls.norminv(p1,c2,d2),2);
			var vatr1_abs = math_util.aux_math_round(p_val*vatr1/100.0,2);
			var vatr2_abs = math_util.aux_math_round(p_val*vatr2/100.0,2);
			$("#benchmark_vatr_pc").text(vatr1);
			$("#portfolio_vatr_pc").text(vatr2);
			$("#portfolio_vatr_abs").text(vatr2_abs);
			$("#benchmark_vatr_abs").text(vatr1_abs);
			//$("#portfolio_5day_vatr").text(test);
			//$("#benchmark_5day_vatr").text("4.0");
		}

	};
}) ();
