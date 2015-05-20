/* BUSINESS LOGIC */
var namespace_portfolio = (function()
{
    /* Constants */
    var API_URL = "/data_api";
    var DATA_LOAD_STATES  = ["loading","loading", "ready"];
    
    /* Private Data */
    var state = {
        load_state: 1,
		benchmark_state: 0,
        next_id: 0,
        list_instruments: [],
        list_benchmarks: [],
        transactions: [],
        net_data: {},
        portfolio_series: {},
        m_benchmark_series: [],
        derived_values: {}
    };
    
    /* Private methods */
    function get_next_id()
    {
        state.next_id = state.next_id + 1;
        return state.next_id;
    }

    function get_first_date()
    {
        if (state.transactions.length>0)
            return state.transactions[0].book_date;
        else
            return datetime_util.adjust_date(new Date(50, 0, 1));
    }

	function compute_position_data()
    {
        var total_cash = 0.0;
        var start_cash = 0.0;
        var net_data = new Object();
        for (var i=0;i<state.transactions.length;i++)
        {
            var row_data = state.transactions[i];
            switch (row_data.type)
            {
                case "Deposit":
                    total_cash = total_cash + parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    start_cash = total_cash;
                    break;
                case "Withdraw":
                    total_cash = total_cash - parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    break; 
                case "Buy":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var last_value = parseFloat(row_data.volume)*parseFloat(row_data.last_price);
                    total_cash =  total_cash - book_value;
                    var hash_value = row_data.asset+'_B';
                    if (net_data[hash_value]==undefined)
                    {
                        net_data[hash_value] = [row_data.volume, book_value, last_value, row_data.sector];
                    }
                    else
                    {
                        net_data[hash_value][0] = parseInt(net_data[hash_value][0]) + parseInt(row_data.volume);
                        net_data[hash_value][1] = parseFloat(net_data[hash_value][1] + book_value);
                        net_data[hash_value][2] = parseFloat(net_data[hash_value][2] + last_value);
                    }
                    break;
                case "Sell":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var hash_value = row_data.asset+'_B';
                    if (net_data[hash_value] != undefined)
                    {
                        var last_price = parseFloat(net_data[hash_value][2]/net_data[hash_value][0]);
                        var book_price = parseFloat(net_data[hash_value][1]/net_data[hash_value][0]);
                        var volum_diff = parseInt(net_data[hash_value][0]) - parseInt(row_data.volume);
                        if (volum_diff>=0)
                        {
                            total_cash = total_cash + book_value;
                            net_data[hash_value][0] = volum_diff;
                            net_data[hash_value][1] = parseFloat(net_data[hash_value][0] * book_price);
                            net_data[hash_value][2] = parseFloat(net_data[hash_value][0] * last_price);
                        }
                        else namespace_gui.send_log_message("not a valid action - can't sell more then you hold", "System");
                    }
                    else namespace_gui.send_log_message("not a valid action - can't sell what you don't have", "System");
                    break;
                case "Short":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var last_value = parseFloat(row_data.volume)*parseFloat(row_data.last_price);
                    var hash_value = row_data.asset+'_S';
                    total_cash =  total_cash - book_value;
                    if (net_data[hash_value]==undefined)
                    {
                        net_data[hash_value]= [row_data.volume, book_value, last_value, row_data.sector];
                    }
                    else
                    {
                        net_data[hash_value][0] = parseInt(net_data[hash_value][0]) + parseInt(row_data.volume);
                        net_data[hash_value][1] = parseFloat(net_data[hash_value][1] + book_value);
                        net_data[hash_value][2] = parseFloat(net_data[hash_value][2] + last_value);
                    }
                    break;
                case "Cover":
                    var hash_value = row_data.asset+'_S';
                    if (net_data[hash_value] != undefined)
                    {
                        var last_price = parseFloat(net_data[hash_value][2]/net_data[hash_value][0]);
                        var book_price = parseFloat(net_data[hash_value][1]/net_data[hash_value][0]);
                        var volum_diff = parseInt(net_data[hash_value][0]) - parseInt(row_data.volume);
                        var book_value = row_data.volume*book_price;
                        if (volum_diff>=0)
                        {
                            net_data[hash_value][0] = volum_diff;
                            net_data[hash_value][1] = parseFloat(net_data[hash_value][0] * book_price);
                            total_cash = total_cash + book_value - row_data.volume*(row_data.book_price - book_price);
                            net_data[hash_value][2] = parseFloat(net_data[hash_value][0] * last_price);
                        }
                        else namespace_gui.send_log_message("Can't cover more than you have in a short position", "System");
                    }
                    else namespace_gui.send_log_message("No short position found to cover", "System");
                    break;
            }
        }
        //namespace_gui.send_log_message("start cash is "+  start_cash, "Info");
        return { "net_positions" : net_data, "total_cash": math_util.aux_math_round(total_cash,2), "start_cash" : start_cash };
    }
   
    /* part 1 - calculate average price for positions and assemble final positions
     * part 2 - get cash nets */
    function compute_net_data(position_data)
    {
        var total_cash = position_data.total_cash;
        var start_cash = position_data.start_cash;
        var cash_change = parseFloat(total_cash - start_cash);
        var position_list =[];
        var profit_or_loss = 0.0;
        var net_profit = 0.0;
        var total_pnl = 0.0;
        var net_value = 0.0;
        var net_data = position_data.net_positions;
        for (var k in net_data)
        {
            if (net_data.hasOwnProperty(k))
            {
                var avg_price = parseFloat(net_data[k][1] / net_data[k][0]);
                if (k.indexOf("_S")>-1)
                {
                    profit_or_loss = - parseFloat(net_data[k][2] - net_data[k][1]);
                    net_value = profit_or_loss + net_value;
                }
                else
                {
                    profit_or_loss = parseFloat(net_data[k][2] - net_data[k][1]);
                    net_value = net_data[k][2] + net_value;
                }
                if (net_data[k][0]>0)
                {
                    position_list.push({"symbol": k, 
                                        "volume": net_data[k][0], 
                                        "price_avg": math_util.aux_math_round(avg_price,2),
                                        "book_value": math_util.aux_math_round(net_data[k][1],2),
                                        "last_value": math_util.aux_math_round(net_data[k][2],2),
                                        "pnl": math_util.aux_math_round(profit_or_loss,2),
                                        "pnl_rel":math_util.aux_math_round(profit_or_loss / net_data[k][1] * 100.0, 2),
                                        "sector":net_data[k][3]
                    });
                }
                total_pnl = total_pnl + profit_or_loss;
             }
        }
        if (position_list.length == 0)   
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-"};
            var end_totals = total_cash;
            total_pnl = "-";
        }
        else
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-" };
            var end_totals = math_util.aux_math_round(total_cash + net_value,2);
			total_pnl = math_util.aux_math_round(total_pnl,2);
        }       
        return {"positions": position_list, "net_cash_row":cash_row, "total_value" : end_totals, "total_pnl": total_pnl};
    }
  
    function cluster_transaction_events()
    {         
        function format_date_extra(s_date)
        {
            var year = s_date.substring(0,4);
            var month = s_date.substring(5,7);
            var datex = s_date.substring(8,10);
            var true_data1= new Date(parseInt(year),parseInt(month)-1, parseInt(datex));
            return true_data1;
        }

        var groups=[];     
        var max_distance=3; 
        for (var i=0; i<state.transactions.length; i++)
        {
            var added = false;
            var t_date = format_date_extra(state.transactions[i].book_date)
            for (var k=0; k <groups.length; k++)
            {
                if (t_date >=groups[k]["start_date"] && t_date <=groups[k]["end_date"])
                {
                    added=true;                    
                }
                else if (datetime_util.date_distance(t_date, groups[k].start_date)<max_distance)
                {   
                    //extend left edge
                    added=true;
                    groups[k]["start_date"] = t_date;
                }
                else if (datetime_util.date_distance(t_date, groups[k].end_date)<max_distance)
                {
                    //extend right edge
                    added=true;
                    groups[k]["end_date"] = t_date;
                }
                if (added)
                {
                    //add to group
                    groups[k]["transactions"].push({
                        "symbol": state.transactions[i].asset,
                        "volume": state.transactions[i].volume,
                        "action": state.transactions[i].type,
                        "price": state.transactions[i].book_price
                    });
                }
            }
            if (!added)
            {
                groups.push ({
                 "start_date": t_date,
                 "end_date": t_date,
                 "transactions":[{
                                "symbol": state.transactions[i].asset,
                                "volume": state.transactions[i].volume,
                                "action": state.transactions[i].type,
                                "price": state.transactions[i].book_price
                                }]     
                });
             }
        } 
        return groups;   
    }
 
    function get_dashboard_data(data, p_label, p_info)
    {
        var dashboard_row ={};
        dashboard_row.portfolio_returns = get_returns_data(data);
        dashboard_row.portfolio_momentum = get_momentum_data(data);
        dashboard_row.asset = p_label;
        dashboard_row.info = p_info;
        return dashboard_row;
    }
 
    function get_returns_data(p_input)
    {
        var offsets=[1, 5, 21, 63, 126, 252];
        var series = [];
        var last_index = p_input.length-1;
        var last_value = p_input[last_index][1];
        for (var i=0;i<offsets.length;i++)
        {
            var first_index = offsets[i];
            if (first_index<=p_input.length)
            {
                var first_value = p_input[last_index - first_index][1];
				if (first_value != 0)
                	series.push(math_util.aux_currency_round((last_value / first_value - 1) * 100.0));
				else series.push(0.0);
            }
            else series.push('-');
        }
        var dashboard_returns = {};
        dashboard_returns.ret_1d = series[0];
        dashboard_returns.ret_1w = series[1];
        dashboard_returns.ret_1m = series[2];
        dashboard_returns.ret_3m = series[3];
        dashboard_returns.ret_6m = series[4];
        dashboard_returns.ret_1y = series[5];
        return dashboard_returns;
    }    

    function get_momentum_data(p_input)
    {
        var momentum_data={};
        if (p_input.length>199)
        {
            var sum200 = 0.0;
            var end_point = p_input.length - 200;
            for (var i=p_input.length - 1;i>end_point - 1;i--)
            {
                sum200 = sum200 + p_input[i][1];
            }
            if ((sum200/200.0)<p_input[p_input.length-1][1])
            {
                momentum_data.p_200d = 'BULLISH';
            }
            else momentum_data.p_200d = 'BEARISH';
        }
        else momentum_data.p_200d = '-';
        if (p_input.length>49)
        {
            var total_sum = 0.0;
            var end_point = p_input.length - 50;
            for (var i=p_input.length - 1;i>end_point - 1;i--)
            {
                total_sum = total_sum + p_input[i][1];
            }
            if ((total_sum/50.0)<p_input[p_input.length-1][1])
            {
                momentum_data.p_50d = 'BULLISH';
            }
            else momentum_data.p_50d = 'BEARISH';
        }
        else momentum_data.p_50d = '-';
        return momentum_data;
    }

    function get_position_chart_data(p_series_data, p_net_value)
    {
        var abs_list=[];
        var rel_list=[];
        var info_obj_abs = {};
        var info_obj_rel = {};
        var data_positions_abs=[];
        var data_positions_rel=[];
		var bubbles_a=[];
		var bubbles_b=[];
		var max_pnl = 0.0;
		var max_pnl_rel = 0.0;
        for (var j=0;j<p_series_data.length;j++)
        {
			if (p_series_data[j].pnl<0) 
				bubbles_a.push([j,p_series_data[j].pnl,"red"]);
			else
				bubbles_a.push([j,p_series_data[j].pnl,"green"]);
			if (p_series_data[j].pnl_rel<0) 
				bubbles_b.push([j,p_series_data[j].pnl_rel,"red"]);
			else
				bubbles_b.push([j,p_series_data[j].pnl_rel,"green"]);
			if (Math.abs(p_series_data[j].pnl)>max_pnl) max_pnl = Math.abs(p_series_data[j].pnl);
			if (Math.abs(p_series_data[j].pnl_rel)>max_pnl_rel) max_pnl_rel = Math.abs(p_series_data[j].pnl_rel);
			
		}
		bubbles_a.sort(function(a,b){
			if (a[1]<b[1]) return -1;
			if (a[1]>b[1]) return 1;
			if (a[1]==b[1]) return 0;
		});
		bubbles_b.sort(function(a,b){
			if (a[1]<b[1]) return -1;
			if (a[1]>b[1]) return 1;
			if (a[1]==b[1]) return 0;
		});
		for (var i=0;i<bubbles_a.length;i++)
		{
			abs_list.push({"x":i,"y":p_series_data[bubbles_a[i][0]].pnl,"color":bubbles_a[i][2]});
			data_positions_abs.push(p_series_data[bubbles_a[i][0]].symbol);
            info_obj_abs[p_series_data[bubbles_a[i][0]].symbol] = {
                "volume": p_series_data[bubbles_a[i][0]].volume, 
                "xpnl": p_series_data[bubbles_a[i][0]].pnl, 
                "rpnl": p_series_data[bubbles_a[i][0]].pnl_rel
            };
	        rel_list.push({"x":i,"y":p_series_data[bubbles_b[i][0]].pnl_rel,"color":bubbles_b[i][2]});
			data_positions_rel.push(p_series_data[bubbles_b[i][0]].symbol);
            info_obj_rel[p_series_data[bubbles_b[i][0]].symbol] = {
                "volume": p_series_data[bubbles_b[i][0]].volume, 
                "xpnl": p_series_data[bubbles_b[i][0]].pnl, 
                "rpnl": p_series_data[bubbles_b[i][0]].pnl_rel
            };
        }
		
        return {
			"abs_list":abs_list, 
			"rel_list":rel_list, 
			"data_positions": [data_positions_abs, data_positions_rel], 
			"hash_table":[info_obj_abs, info_obj_rel],
			"max_pnl":max_pnl,
			"max_pnl_rel":max_pnl_rel};
    } 

    function get_sector_chart_data(p_net_data)
    {
        var chart_data=[];
        var hash_table = {};
        for (var i=0; i<p_net_data.positions.length; i++)
        {
            var sector = p_net_data.positions[i].sector;
            //if there is a sector value defined, add to that sector accumulated 
            //if there is not a sector value, create a sector 
            if (hash_table[sector] == undefined)
            {
                hash_table[sector]=p_net_data.positions[i].last_value;
            }
            else
            {
                //if short, subtract?
                 hash_table[sector]= hash_table[sector]+p_net_data.positions[i].last_value;
            }
       }
       hash_table["Cash"] = p_net_data.net_cash_row.total_cash;
       //iterate over each row, and get percentage value for each sector
       for (var x in hash_table)
       {
            if (hash_table.hasOwnProperty(x))
            {
                var percentage_value = (hash_table[x] / p_net_data.total_value) * 100; 
                chart_data.push([x, percentage_value]);
            }
       } 
       return chart_data;
    }    

    function compute_derived_values(p_data)
    {
        var derived_values = {};
        derived_values["value_end"] = p_data.pop()[1];
        derived_values["value_start"] = 100.0;
        derived_values["diff_percent"] = p_data.pop()[1] - p_data[0][1];
        derived_values["annualized"] = math_util.compute_annualized(derived_values["diff_percent"], get_first_date());
        derived_values["std_dev"] = math_util.compute_stdev(p_data);
        return derived_values; 
    }

    function aux_list_slice(p_list, p_start, p_end)
    {
        var res_list = [];
        for (var i=p_start; i<p_end; i++)
        {
            res_list.push(p_list[i][1]);
        }
        return res_list;
    }

    function aux_std_dev(p_list)
    {
        function sum(a_list)
        {
            var a_sum = 0.0;
            for (var k=0;k < a_list.length; k++)
            {
                a_sum = a_sum + a_list[k];
            }
            return a_sum;
        };
        var list_sum = sum(p_list);
        var mean  = list_sum/p_list.length;
        var i = 0;
        while (i<p_list.length)
        {
            p_list[i] = Math.pow((p_list[i]-mean), 2);
            i = i + 1;
        }
        var std_dev = Math.sqrt(sum(p_list)/(p_list.length-1));
        return std_dev;
    }

    /* TODO - Port the python code into js */
    function compute_local_risk_series(p_series, p_interval)
    {
        var list_intermediate=[];
        var i=0;
        while (i<p_series.length-1)
        {
            if (p_series[i][1] == 0.0)
                var s = 0.0;
            else
                var s = p_series[i+1][1] / p_series[i][1] - 1.0;
            list_intermediate.push([p_series[i+1][0],s]);
            i = i + 1;
        }
        var frame_start = 0;
        var frame_end = p_interval;
        var list_result = [];
        while (frame_end<=list_intermediate.length)
        {
            var new_list = aux_list_slice(list_intermediate, frame_start, frame_end);
            var val = aux_std_dev(new_list)*Math.sqrt(252);
            list_result.push([list_intermediate[frame_start][0],val]);
            frame_start = frame_start + 1;
            frame_end = frame_end + 1;
        }
        return list_result 
    }

    function postprocess_data(p_data, p_color, p_x_mul)
    {
        var data_a = new Array;
        for (var i = 0; i <p_data.length; i++)
        {
            data_a[i] = {x:p_data[i][0],y:p_data[i][1]*p_x_mul,color:p_color};
        }
        return data_a;
    }

	//step 1 - create cash row
	//step 2 - group by sectors
	//step 3 - group by equity (all sectors)
	function compute_sector_table(p_data)
	{
		var sector_table =[];
		// step 1
		sector_table.push({
			"asset":"Cash",
			"book_value": p_data["net_cash_row"]["total_cash"],
			"market_value": p_data["net_cash_row"]["total_cash"],
			"unrealized_pnl": 0.0,
			"% of portfolio": (p_data["net_cash_row"]["total_cash"]/p_data["total_value"])*100
		});
		//group by sector
		var hash_table = {};
		$.each(p_data["positions"], function(index, value)
		{			
			var sector = value["sector"];
			if (hash_table[sector] == undefined)
			{
				hash_table[sector] = {
					"asset": value["sector"],
					"book_value": value["book_value"],
					"market_value": value["last_value"],
					"unrealized_pnl": value["pnl"],
					"% of portfolio": (value["last_value"]/p_data["total_value"])*100
				}
			}
			else
			{
				hash_table[sector]["book_value"] = hash_table[sector]["book_value"] + value["book_value"];
				hash_table[sector]["market_value"] = hash_table[sector]["market_value"] + value["last_value"];
				hash_table[sector]["unrealized_pnl"] = hash_table[sector]["unrealized_pnl"] + value["pnl"];
				hash_table[sector]["% of portfolio"] = hash_table[sector]["% of portfolio"] + (value["last_value"]/p_data["total_value"])*100;
			}
		});
		// append to net rows
		for (var key in hash_table)
		{
			if (hash_table.hasOwnProperty(key))
			{
				sector_table.push(hash_table[key])
			}
		}
		var net_row = {
			"asset":"Total Equity",
			"book_value": 0.0,
			"market_value": 0.0,
			"unrealized_pnl": 0.0,
			"% of portfolio": 0.0
		}
		//step 3
		$.each(p_data["positions"], function(index, value)
		{	
			net_row["book_value"] = net_row["book_value"] + value["book_value"];
			net_row["market_value"] = net_row["market_value"] + value["last_value"];
			net_row["unrealized_pnl"] = net_row["unrealized_pnl"] + value["pnl"];
			net_row["% of portfolio"] = net_row["% of portfolio"] + (value["last_value"]/p_data["total_value"])*100;
		});
		//net_row["% of portfolio"]=math_util.aux_math_round(net_row["% of portfolio"],2);
		sector_table.push(net_row);
		sector_table.push({
			"asset":"Total Portfolio",
			"book_value": net_row["book_value"]+sector_table[0]["book_value"],
			"market_value": net_row["market_value"]+sector_table[0]["market_value"],
			"unrealized_pnl": net_row["unrealized_pnl"]+sector_table[0]["unrealized_pnl"],
			"% of portfolio": net_row["% of portfolio"]+sector_table[0]["% of portfolio"]
		});
		return sector_table;
	}
	
	
	function compute_positions_risk(p_data)
	{
		var risk_table=[];
		$.each(p_data["positions"], function(index, value){
			risk_table.push({
				"return":((value["last_value"]/value["book_value"]) - 1.0)*100.0,
				"weight":(value["last_value"]/p_data["total_value"])*100.0,
				"contrib": ((value["last_value"]/value["book_value"]) - 1.0)*(value["last_value"]/p_data["total_value"])*100.0,
				"risk": null//Ha-Ha-Ha: denied!
			});
		});
		return risk_table;
	}

    function recompute_and_render()
    {
            //sort transactions before processing
            state.transactions.sort(function (a,b){
                if (a.book_date > b.book_date) return 1;
                if (a.book_date < b.book_date) return -1;
                return 0;
            });
            // step 1. aggregate transaction data and compute position rows and net values
            // also render immediately
            state.net_data = compute_net_data(compute_position_data()); 
			var sector_breakdown_table= compute_sector_table(state.net_data);
			var risk_table = compute_positions_risk(state.net_data);
            namespace_gui.render_tables(state.net_data, state.transactions, sector_breakdown_table, risk_table);
            // step 2. load profit, risk risk and volatility series, then compute 
            // dashboard and derived values and render portfolio tables and charts
            var post_data = JSON.stringify({"transactions":state.transactions, "positions": state.net_data["positions"]});
            if (state.transactions.length>0) $.post('/data_api/', {call:"portfolio_series", data: post_data}, function(data)
            {
                var json_data = JSON.parse(data);    
                if (json_data.header.error_code == 0)
                {
                    //aggregated portfolio series
                    state.portfolio_series["value_series"] = json_data.value_series;
                    state.portfolio_series["pnl_series"] = json_data.pnl_series;
                    state.portfolio_series["norm_pnl_series"] = json_data.norm_pnl_series; //deprecated
                    state.portfolio_series["norm_pnl_split"] = json_data.norm_pnl_split;
                    state.portfolio_series["norm_value_series"] = json_data.norm_value_series;
                    state.portfolio_series["position_value_series"] = json_data.position_value_series;
					state.portfolio_series["position_risk_series"] = json_data.position_risk_series;
					//console.log("Stock_chart risk...");
                    var dashboard_rows = [get_dashboard_data(state.portfolio_series["value_series"], "Portfolio", "-")];
                    for (var i=0; i<state.portfolio_series["position_value_series"].length;i++)
                    {

                        var xrow = get_dashboard_data(
                            state.portfolio_series["position_value_series"][i]["series"],
                            state.portfolio_series["position_value_series"][i]["symbol"],"-");
                        dashboard_rows.push(xrow);
                    }
                    state.portfolio_series["dashboard_data"] = dashboard_rows;
                    state.portfolio_series["position_chart_data"] = get_position_chart_data(state.net_data.positions,state.net_data.total_value);  
                    state.portfolio_series["sector_chart_data"] = get_sector_chart_data(state.net_data);
                    state.portfolio_series["risk_chart_data"] = json_data.derived_risk;
					//compute_local_risk_series(state.portfolio_series["norm_pnl_series"], state.risk_interval);
                    state.portfolio_series["derived_values"] = json_data.derived_split;
                    state.portfolio_series["transaction_clusters"] = cluster_transaction_events();
                    // draw all the charts and dashboards
                    namespace_gui.render_portfolio_dashboard(state.portfolio_series["dashboard_data"]);
					//update the portfolio with first benchmark
					if (state.benchmark_state == 0)
					{	
						state.benchmark_state = 1;
						add_dashboard_benchmark(state.list_benchmarks[0].value);
					}
                    namespace_gui.update_charts(state);
					namespace_gui.render_risk_decomposition_table(state.portfolio_series["position_risk_series"],state.net_data);
                }
                else 
                {
                    namespace_gui.send_log_message("Failed to receive correct portfolio time series data", "System");
                    namespace_gui.send_log_message(json_data, "System");
                }
            });
            else {
				state.benchmark_state = 0;
				namespace_gui.set_visibility(0);
                clear_dashboard_benchmarks();
			}
    }

    /* This one definitely needs unit testing */ 
    function check_transaction(p_action)
    {
        var valid_flag = true;
        var valid_message = "No error";
        var message = "No error";
        
        /* Part 1  - basec validation and sanity check */
        if (p_action.asset==null || p_action.asset==undefined || p_action.asset=='') 
            message = "Incorrect symbol";
        if (p_action.volume <=0 || p_action.volume==null || p_action.volume=='')
            message = "Transaction volume can't be undefined, zero or negative";
        if (p_action.book_price<=0 || p_action.book_price==null || p_action.book_price =='' || p_action.last_price<0)
            message = "Transaction price can't be undefined or negative";
        
        /* Part 2 - check transaction dates */
        var last_date = datetime_util.adjust_date(new Date()); 
        var first_date = get_first_date();
        if (p_action.book_date > last_date || p_action.book_date < first_date)
            message = "Transaction date is outside the valid range betwen " + first_date + " and " + last_date;
        
        /* Part 3 - check Withdraw transactions */
        if (p_action.type == "Withdraw"  && state.net_data.net_cash_row.total_cash < p_action.volume)
            message = "Insufficient cash to withdraw"; 
       
        /* Part 4 - buy validation */
        if (p_action.type == "Buy") 
        {
            //Rule B1
            if (state.net_data.net_cash_row.total_cash < p_action.volume*p_action.book_price)
                message = "Insufficient cash to buy position";
            //Rule B2 - can't buy if open short position exixts
            var search_str = p_action.asset +"_S";
            for (var i=0;i< state.net_data.positions.length; i++)
            {   
                if (state.net_data.positions[i].symbol == search_str && state.net_data.positions[i].volume>0)
                {
                    message = "Cannot buy same stock with open short position";
                    break;
                }
            }
        }
        /* Part 5 - sell validation 
         * S1 Can't sell if no long position or insufficient quantity of long position
         * S2 ...Or sell before buy! */
        if (p_action.type == "Sell") 
        {
            var search_str = p_action.asset +"_B";
            var found = false;
            for (var i=0;i< state.net_data.positions.length; i++)
            {   
                if (state.net_data.positions[i].symbol == search_str)
                {
                    if (p_action.volume > state.net_data.positions[i].volume)
                    {
                        found = true;
                        message = "Cannot sell more then you hold";
                        break;
                    }
                    else found = true;
                }
            }
            if (!found)
            {
                message = "No long position to sell";
            }
        }
        /* Short validation */
        if (p_action.type == "Short") 
        {
            //Rule SS1 - check cash
            if (state.net_data.net_cash_row.total_cash < p_action.volume*p_action.book_price)
                message = "Insufficient cash to borrow position";
            //Rule SS2 - can't buy if open long position exixts
            var search_str = p_action.asset +"_B";
            for (var i=0;i< state.net_data.positions.length; i++)
            {   
                if (state.net_data.positions[i].symbol == search_str && state.net_data.positions[i].volume>0)
                {
                    message = "Cannot short stock if there is a long position in the same stock";
                    break;
                }
            }
        }

        /* Cover validation 
         * Rule C1 - Can't cover if no short position to cover
         * Rule C2 - Can't cover more then short position */
        if (p_action.type == "Cover") 
        {
            var search_str = p_action.asset +"_S";
            var found = false;
            for (var i=0;i< state.net_data.positions.length; i++)
            {   
                if (state.net_data.positions[i].symbol == search_str)
                {
                    if (p_action.volume > state.net_data.positions[i].volume)
                    {
                        found = true;
                        message = "Cannot cover more then you have borrowed";
                        break;
                    }
                    else found = true;
                }
            }
            if (!found)
            {
                message = "No short position to cover";
            }
        }

        /* Set result flag */
        if (message != valid_message)
            valid_flag = false;

        return { "valid": valid_flag, "error_message": message };
    }
    
    function push_and_recompute(p_action, function_call)
    {
        var check_result = check_transaction(p_action);
        if (check_result.valid) 
        {
            p_action.gui_id = get_next_id();
            state.transactions.push(p_action);
            function_call();
        }
        else namespace_gui.send_log_message(check_result.error_message, "User");
   }
        

    /* postprocess transaction if neccessary*/
    function add_transaction(p_action, function_call)
    {
        namespace_gui.set_visibility(1);
        if (p_action.type == "Deposit" || p_action.type == "Withdraw")
        {
            push_and_recompute(p_action, function_call);
        }
        else 
        {
            var last_date = datetime_util.adjust_date(datetime_util.get_yesterday_date());
            $.getJSON(API_URL, {instrument:p_action.asset, call:"quote", datetime:last_date}, function(data)
            {
                if (data.header.error_code == 0)
                {
                    p_action.last_price = math_util.aux_math_round(data.contents.price,2);
                    $.getJSON(API_URL, {instrument:p_action.asset, call:"sector"}, function(data)
                    {
                        if (data.header.error_code == 0)
                        {
                            p_action.sector = data.contents.sector_data;
                            push_and_recompute(p_action, function_call); 
                        }
                        else {
                           namespace_gui.send_log_message("Failed to load sector data, see responce data below", "System");
                           namespace_gui.send_log_message(data, "System");
                        }
                    });
                }
                else {
                    namespace_gui.send_log_message("Failed to load quote data, see raw responce below", "System");
                    namespace_gui.send_log_message(data, "System");
                }
            });
        }
    }

    /* received transaction gui id and  then attempt deletion */
    function remove_transaction(p_id, function_call)
    {
        var delete_index = -1; 
        for (var i = 0; i<state.transactions.length; i++)
        {
            if (state.transactions[i].gui_id == p_id)
                delete_index=i;
        }
        if (delete_index != -1) 
            state.transactions.splice(delete_index, 1);
		else
		{
			
		}
       function_call();
    } 
    
    /* load benchmark series for the duration of portfolio
     * then apply the derived data computation
     * and render dashboard benchmark row */
    function add_dashboard_benchmark(p_benchmark)
    {
		state.m_benchmark_series['dashboard_data']=[];
        $.getJSON(API_URL, {call:"benchmark_series", symbol: p_benchmark, start_date: get_first_date()}, function(data)
        {
            if (data.header.error_code == 0)
            {
				// in - all series data
				// for each data also compute derived values in the array of same length
               // var risk_data = compute_local_risk_series(data["norm_value_series"], state.risk_interval);
               // var derived_data = compute_derived_values(data["norm_value_series"]);
                state.m_benchmark_series[p_benchmark]= {
					"norm_value_series": data["norm_value_series"], 
					"norm_value_split":data["norm_value_split"],
                    "risk_chart_data": data["derived_risk"],
                    "derived_values":data["derived_split"],
				};
                row_data = get_dashboard_data(data["norm_value_series"], "Benchmark", "-");
               // calculate benchmark derived data
               // update portfolio derived data = partial (beta, etc) 
                state.m_benchmark_series['dashboard_data'].push(row_data);
                namespace_gui.update_benchmark_selector(p_benchmark);
                namespace_gui.append_dashboard_row([row_data]);
                namespace_gui.set_visibility(2);
                namespace_gui.refresh_performance_chart_and_tab();
            }
        });
    }

    function clear_dashboard_benchmarks()
    {
        //zero out benchmarks
        state.m_benchmark_series = {};
        namespace_gui.clear_benchmark_selector();
        namespace_gui.clear_dashboard_benchmark_rows();
        namespace_gui.set_visibility(3);
        namespace_gui.refresh_performance_chart_and_tab();
    }

    function init_gui_if_ready()
    {
        if (DATA_LOAD_STATES[state.load_state] == "ready")
        {
            namespace_gui.init_page(state);
        }
    }
    
	function get_net_summary_object()
	{
		return [["Net Value", "Net PnL"],[state.net_data["total_value"], state.net_data["total_pnl"]]];
	}
	
	function get_transaction_history_object()
	{
		var contents = [["Symbol", "Sector", "Action", "Volume", "Book Date", "Book Price", "Last Price"]];
		$.each(state["transactions"], function(ind, val)
		{
			var row_list = [val["asset"], 
							val["sector"], 
							val["type"], 
							val["volume"], 
							val["book_date"], 
							val["book_price"], 
							val["last_price"]];
			contents.push(row_list);
		});
		return contents;
	}
	
	function get_positions_object()
	{
		var contents = [["Symbol", "Volume", "Average Price", "Book Value", "Last Value", "PnL"]]
		$.each(state.net_data["positions"], function(ind, val)
		{
			var row_list = [val["symbol"], 
				val["volume"], 
				val["price_avg"], 
				val["book_value"], 
				val["last_value"], 
				val["pnl"]];
			contents.push(row_list);
		});
        //var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-" };
		var cash_row = ['Cash', 
						'-', 
						'-',
						state.net_data["net_cash_row"]["start_cash"],
						state.net_data["net_cash_row"]["total_cash"],
						'-'
		];
		contents.push(cash_row);
		return contents;
	}
	
	function get_portfolio_returns_object()
	{
		var contents = [
			["Position", "Info", "1d %", "1w %", "1m %", "3m %", "6m %", "1y %", "50D-MA", "200D-MA"]
		];
		$.each(state.portfolio_series["dashboard_data"], function(index, value)
		{
			contents.push([
				value["asset"],
				value["info"], 
				value["portfolio_returns"]["ret_1d"],
				value["portfolio_returns"]["ret_1w"],
				value["portfolio_returns"]["ret_1m"],
				value["portfolio_returns"]["ret_3m"],
				value["portfolio_returns"]["ret_6m"],
				value["portfolio_returns"]["ret_1y"],
				value["portfolio_momentum"]["p_50d"],
				value["portfolio_momentum"]["p_200d"],
			]);
		});
		return contents;
	}
	
	function get_benchmark_returns_object()
	{
		var contents = [
			["Position", "Info", "1d %", "1w %", "1m %", "3m %", "6m %", "1y %", "50D-MA", "200D-MA"]
		];
		$.each(state.m_benchmark_series["dashboard_data"], function(index, value)
		{
			contents.push([
				value["asset"],
				value["info"], 
				value["portfolio_returns"]["ret_1d"],
				value["portfolio_returns"]["ret_1w"],
				value["portfolio_returns"]["ret_1m"],
				value["portfolio_returns"]["ret_3m"],
				value["portfolio_returns"]["ret_6m"],
				value["portfolio_returns"]["ret_1y"],
				value["portfolio_momentum"]["p_50d"],
				value["portfolio_momentum"]["p_200d"],
			]);
		});
		return contents;
	}
	
    /* Load required page data:
    * - Instruments list
    * - Benchmarks list  
    * -Set values for empty portfolio  */
    
	function initialize()
    {
        $.getJSON(API_URL, { call:"stock_list" }, function (data) 
        {
            if (data.header.error_code == 0)
            {
                state.list_instruments = data.contents.stocks;
                state.list_benchmarks = data.contents.benchmarks;
                state.load_state = state.load_state+1;     
                init_gui_if_ready();
            }
        });
        //create empty portfolio
        state.net_data = {
            "net_cash_row": {
                "start_cash" : 0.0,
                "total_cash" : 0.0,
                "cash_change" : 0.0,
            },
            "positions" :[],
            "total_value" : 0.0,
            "total_pnl" : 0.0
        }
    }
	
	/* receive the list of parts and assembole the json object to be interpreted as pdf report */
	function generate_pdf_report(p_data)
	{
		//works with array only
		var report_object = [];
		$.each(p_data, function(index,value)
		{
			switch(value)
			{
				case 'p_table_sum':
					var contents = get_net_summary_object();
					report_object.push({"type":"table","contents": contents, "header":"Portfolio summary", "styles":["pnl_color"]});
					break;
				case 'p_table_hist':
					var contents = get_transaction_history_object();
					report_object.push({"type":"table",	"contents": contents, "header": "Transaction history"});
					break;
				case 'p_table_pos':
					var contents = get_positions_object();
					report_object.push({"type":"table","contents": contents, "header": "Net positions"});
					break;
				case 'p_chart_returns':
					var chart_object = JSON.stringify(namespace_graphs.return_performance_chart_object());
					report_object.push({"type":"chart", "contents": chart_object, "header": "Portfolio vs Benchmark: Performance"});
					break;
				case 'p_chart_val_pnl':
					var chart_object = JSON.stringify(namespace_graphs.return_val_pnl_chart_object());
					report_object.push({"type":"chart", "contents": chart_object, "header": "Portfolio Value"});
					break;
				case 'p_chart_position':
					var chart_object = JSON.stringify(namespace_graphs.return_position_chart_object());
					report_object.push({"type":"chart", "contents": chart_object, "header": "Portfolio Positions chart"});
					break;
				case 'p_chart_sector':
					var chart_object = JSON.stringify(namespace_graphs.return_sector_chart_object());
					report_object.push({"type":"chart", "contents": chart_object, "header": "Portfolio Sectors"});
					break;
				case 'p_table_portfolio_returns':
					var contents = get_portfolio_returns_object();
					report_object.push({"type":"table", "contents": contents, "header": "Portfolio Returns"});
					break;
				case 'p_table_benchmark_returns':
					var contents = get_benchmark_returns_object();
					report_object.push({"type":"table", "contents": contents, "header": "Benchmark Returns"});
					break;
				case 'p_chart_risk':
					var contents = JSON.stringify(namespace_graphs.return_risk_chart_object());
					report_object.push({"type":"chart", "contents": contents, "header": "Portfolio vs Benchmark: Risk "});
					break;
				case 'p_chart_heatmap':
					var contents = JSON.stringify(namespace_graphs.return_heatmap_chart_object());
					report_object.push({"type":"chart", "contents": contents, "header": "Portfolio vs Benchmark: Risk and Returns "});
					break;
				case 'p_chart_historical_risk':
					var contents = JSON.stringify(namespace_graphs.return_quadrant_chart_object());
					report_object.push({"type":"chart", "contents": contents, "header": "Portfolio vs Benchmark: Historical Risk and Returns "});
					break;
			}				
		});
		namespace_gui.process_message("attach_report", report_object);
		//return report_object;
	}
	
    /* default risk interval and such */
    function load_portfolio_defaults(p_data)
    {
        state.risk_interval = p_data["risk_interval"];
    }
	
    /* Public methods */
    return {
        /* message handler */
        update_state: function (p_verb, p_data)
        {
            switch (p_verb)
            {
                case "add_record":
                    add_transaction(p_data, recompute_and_render); 
                    break;
                case "remove_record":
                    remove_transaction(p_data, recompute_and_render);
                    break;
                case "add_dashboard_benchmark":
                    add_dashboard_benchmark(p_data);
                    break;
                case "clear_dashboard_benchmarks":
                    clear_dashboard_benchmarks();
                    break;
				case "initialize":
					initialize();
					break;
				case "create_pdf":
					generate_pdf_report(p_data);
					break;
				case "load_defaults":
					load_portfolio_defaults(p_data);
					break;
            }
        }
    }
}) ();

