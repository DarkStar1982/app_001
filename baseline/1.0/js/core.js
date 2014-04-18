//////////////////////////// GLOBAL DATA  //////////////////////////////////////////////////
var cached_data = new Object;
var vChart;
var ppChart;
var pChart;


//////////////////////////// ON PAGE LOAD //////////////////////////////////////////////////
$(function() {
	//populate stock list with available symbols
	$.get("data_api",{type:"stock_list"},function (data) {
		var test = data.split(',');
		for (var i=0;i<test.length;i++)
		{
			test[i] = test[i].replace(/\'/g,'');
			var x_item = new Object();
			var split_test = test[i].split(':');
			x_item.label=split_test[1];
			x_item.value=split_test[0].trim();
			test[i]=x_item;
		}
		$("#instrument_entry").autocomplete({
			source:test,
			select:function(event, ui) {
                        	var tdate = $("#date_entry").datepicker("getDate");
				if (tdate!=null){
 					var xdate = datetime_util.adjust_date($("#date_entry").datepicker("getDate"));
					var symbol = ui.item.value;
                               		//var symbol = $("#instrument_entry").val();
					$.get("data_api",{id:symbol, type:"quote", qdate:xdate}, function(data){
                                        	$("#price_entry").val(data);
					});	
				}
			}	
		});	
	});
	//load indexes and benchmarks
	$.get("data_api",{type:"benchmark_list"},function(data) {
		var data_array =data.split(',');
		var test_data = new Array();		
		for (var i=0; i<data_array.length;i++)
		{
			benchmark_item = data_array[i].split(':');
			benchmark_name = benchmark_item[1].split('(')[0];
			test_data[benchmark_name] = benchmark_item[0];
			$("#benchmark_list").append("<option>"+benchmark_name+"</option>");
		}
	});
	//initialize date select UI controls
	$("#portfolio_date").datepicker();
	//transaction datetime picker
	$("#date_entry").datepicker({
		onSelect: function(dateText, inst) { 
			var xdate = datetime_util.adjust_date($(this).datepicker("getDate"));
                        var symbol = $("#instrument_entry").val();
			$.get("data_api",{id:symbol, type:"quote", qdate:xdate}, function(data){
                     	   $("#price_entry").val(data);
			});	
		}
	});
	//hide the parts that are not ready yet
	namespace_ui.set_visibility(false);
  });

////////////////////////////// ENTRY POINT /////////////////////////////////////////////
function render_page()
{
	//get all data
	recompute_portfolio()
	draw_charts(0);
}
	
//////////////// PORTFOLIO COMMANDS //////////////////////////
// Set initial cash value and subsequent deposits
function deposit_cash()
{
	var value = $("#portfolio_cash").val();
	var rawdate = $("#portfolio_date").datepicker("getDate");
	//convert raw date into "YYYY-MM-DD" formate
       	var sdate = datetime_util.adjust_date(rawdate);
	var index=namespace_ui.get_cash_position_index();
	if (index>-1) {
		var last_id=$("#matrix").children("tr").last().attr('id');
		var new_id=parseInt(last_id)+1;
		var str_row = namespace_ui.create_table_row(new_id,'Cash','-','Deposit',value,sdate,'1.0','1.0');
		$("#matrix").append(str_row);
	}
	else {
		var str_row = namespace_ui.create_table_row('1','Cash','-','Deposit',value,sdate,'1.0','1.0');
		$("#matrix").prepend(str_row);
		namespace_ui.set_visibility(true);
	}
        render_page();
}
	
function withdraw_cash()
{
	var value = $("#portfolio_cash").val();
	var rawdate = $("#portfolio_date").datepicker("getDate");
	//convert raw date into "YYYY-MM-DD" formate
        var sdate = datetime_util.adjust_date(rawdate);
	var last_id=$("#matrix").children("tr").last().attr('id');
	var new_id=parseInt(last_id)+1;	
	var cash_record = {
		t_id: 'Cash', 
		t_sector: '-',
		t_bsell: 'Withdraw',
		t_volume: value,
		t_book_date: sdate,
		t_book_price:'1.0',
		t_last_price:'1.0'};
	var check_result = validate_transaction(cash_record);
	if (check_result.valid)
	{
		var str_row = namespace_ui.create_table_row(new_id,'Cash','-','Withdraw',value,sdate,'1.0','1.0');
		$("#matrix").append(str_row);
		render_page();	
	}
	else alert(check_result.message);
}
	
function update_display_price()
{	
        var symbol = $("#instrument_entry").val();
        //alert("event trigger ok");
	var xdate = $("#date_entry").datepicker("getDate");
	$.get("data_api",{id:symbol, type:"quote", qdate:xdate}, function(data){
               	$("#price_entry").val(data);
	});	
}

//Add equity position
function append_row_action()
{
		//get last row and increment by 1
		var last_id=$("#matrix").children("tr").last().attr('id');
		var new_id=parseInt(last_id)+1;
		//set the asset class 
		//get selected amount and instrument full and short name
		var symbol = $("#instrument_entry").val();
		var volume = $("#amount_entry").val();
		var uprice = $("#price_entry").val();
		var xdate = $("#date_entry").datepicker("getDate");
		var udate = datetime_util.adjust_date(xdate);
		var currentdate = datetime_util.get_yesterday_date();
		var xydate=datetime_util.adjust_date(currentdate); 
		var bsell = $("#trade_type").val();
		var current_price;
		var sector;
		//get the latest available quote and industry sector, given short name
		$.get("data_api",{id:symbol, type:"quote", qdate:xydate}, function(data){
                	current_price  = math_util.aux_currency_round(parseFloat(data));
		}).done( function (){
			$.get("data_api",{id:symbol, type:"sector"},function(data) {
				sector = data;
				var transaction_record = {t_id: symbol, 
							  t_sector: sector,
							  t_bsell: bsell,
							  t_volume: volume,
							  t_book_date: udate,
						          t_book_price:uprice,
							  t_last_price: current_price};
				var check_result = validate_transaction(transaction_record);
				if (check_result.valid) {
					var row=namespace_ui.create_table_row(new_id,symbol,sector,bsell,volume,udate,uprice,current_price);
					$("#matrix").append(row);
					render_page();
				}
				else alert (check_result.message);
			});
		}); 	
}
		
//Remove equity position
function remove_row_action(param)
{
	var tr = param.parentNode.parentNode;
	var id = "#"+tr.id;
	$(id).remove();
	if (id=="#1")
	{	
		namespace_ui.set_visibility(false);
	}
	render_page();	
}

//////////////////////////////////COMPUTE PORTFOLIO PART ///////////////////
// Step 1 - get data
// Update
function recompute_portfolio()
{
	var transactions = namespace_ui.get_portfolio_transactions();
	var positions = compute_positions(transactions);
	var net_positions = compute_net_positions(positions);	
	namespace_ui.render_net_positions(net_positions);
	namespace_ui.render_comparative_reports(net_positions);
	namespace_ui.render_dashboard(net_positions);
	//namespace_ui.render_risk_report();
}


//Part 1. check individual transaction 
//Part 2. check if valid within portfolio context
function validate_transaction(p_new_record)
{
	var current_list = namespace_ui.get_portfolio_transactions();
	var result = {
			valid:true, 
			message: "Undefined error"
	};
	//Part 1
	if (p_new_record.t_id==null || p_new_record.t_id==undefined || p_new_record.t_id=='')
	{
		result.valid = false;
		result.message = "Incorrect symbol";
	}
	if (p_new_record.t_volume <=0 || p_new_record.t_volume==null || p_new_record.t_volume=='')
	{
		result.valid=false;
		result.message = "Transaction volume can't be undefined, zero or negative";
	}
	if (p_new_record.t_book_price<=0 || p_new_record.t_book_price==null ||p_new_record.t_book_price==''
	    || p_new_record.t_last_price<0)
	{
		result.valid=false;
		result.message = "Transaction price can't be undefined or negative";
	}		
		
	//Part 2
	//A.1 check if date of the transaction doesn't fall outside of valid range
	var st_date = (current_list[0].b_date);
	var en_date = datetime_util.adjust_date(new Date());
	if (p_new_record.t_book_date>en_date || p_new_record.t_book_date<st_date)
	{
		result.valid=false;
		result.message = "Transaction date is outside the valid range betwen "+st_date+" and "+en_date	
	}
	var net_p = compute_net_positions(compute_positions(current_list));	
	//A.2 Can't withdraw more then cash on hand
	if (p_new_record.t_bsell=='Withdraw' && net_p.cash_net.total_cash < p_new_record.t_volume)
	{
		result.valid=false;
		result.message = "Insufficient cash to withdraw";
	}
	//BUY VALIDATION
	if (p_new_record.t_bsell == 'Buy')
	{
		//B.1 Can't buy if insufficient funds
		if (net_p.cash_net.total_cash < p_new_record.t_volume*p_new_record.t_book_price)
		{
			result.valid = false;
			result.message = "Insufficient cash to buy position";
		}
		//B.2 Can't buy if there is a uncovered short position already existing for the same symbol
		var search_str = p_new_record.t_id+"_S";
		for (var x in net_p.positions)	
		{
			if (net_p.positions.hasOwnProperty(x))
			{
				if (net_p.positions[x].symbol == search_str && net_p.positions[x].volume>0)
				{
					result.valid = false;
					result.message = "Cannot buy same stock with open short position";
				}
			}
		}

	}
	//SELL VALIDATION	
	// 	B.1 Can't sell if no long position or insufficient quantity of long position
	// 	Or sell before buy!
	if (p_new_record.t_bsell == 'Sell')
	{
		var not_found=true;
		var search_str = p_new_record.t_id+"_B";
		for (var x in net_p.positions)	
		{
			if (net_p.positions.hasOwnProperty(x))
			{
				//console.log(net_p.positions[x].symbol);
				if (net_p.positions[x].symbol == search_str)
				{
					if (net_p.positions[x].volume<p_new_record.t_volume)
					{
						result.valid = false;
						result.message = "Cannot sell more than you have";
					}
					else {
						not_found = false;
						break;
					}
				}	
			}
		}
		if (not_found) 
		{
			result.valid = false;
			result.message = "No long position to sell";
		}	
	}		
	// SHORT VALIDATION	
	if (p_new_record.t_bsell == 'Short')
	{
		//B.1 Can't short if insufficient funds
		if (net_p.cash_net.total_cash < p_new_record.t_volume*p_new_record.t_book_price)
		{
			result.valid = false;
			result.message = "Insufficient cash to borrow position";
		}
		//B.2 Can't short if there is a long position already
		var search_str = p_new_record.t_id+"_B";
		for (var x in net_p.positions)	
		{
			if (net_p.positions.hasOwnProperty(x))
			{
				//console.log(net_p.positions[x].symbol);
				if (net_p.positions[x].symbol == search_str)
				{
					result.valid = false;
					result.message = "Cannot short if there is a long position alredy";
					break;
				}	
			}
		}
	}
	//COVER  VALIDATION
	//D.1 Can't cover if no short position to cover
	//D.2 Can't cover more then short position
	if (p_new_record.t_bsell == 'Cover')
	{
		var not_found=true;
		var search_str = p_new_record.t_id+"_S";
		for (var x in net_p.positions)	
		{
			if (net_p.positions.hasOwnProperty(x))
			{
				//console.log(net_p.positions[x].symbol);
				if (net_p.positions[x].symbol == search_str)
				{
					not_found = false;
					if (net_p.positions[x].volume<p_new_record.t_volume)
					{
						result.valid = false;
						result.message = "Cannot cover more than you have borrowed";
					}
				}	
			}
		}
		if (not_found) 
		{
			result.valid = false;
			result.message = "No short position to cover";
		}	
	}		
	return result;
}

//compute positions -  step 1
function compute_positions(p_transactions)
{
	var raw_data = p_transactions;
	var portfolio_summary = new Array();
	var total_cash = 0.0
	var start_cash = 0.0;
	var net_data = new Object();
	for (var i=0;i<raw_data.length;i++)
	{
		if (raw_data[i].type=="Deposit")
		{
			var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
			total_cash = total_cash + b_val;	
			start_cash = total_cash;
		}
		if (raw_data[i].type=="Withdraw")
		{
			var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
			total_cash = total_cash - b_val;	
		}
		if (raw_data[i].type=="Buy")
		{
			var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
			var c_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].c_price); 
			total_cash =  total_cash - b_val;
			hash_index = raw_data[i].symbol+'_B';
			if (net_data[hash_index]==undefined)		
			{
				net_data[hash_index] = new Array();
				net_data[hash_index][0] = raw_data[i].volume;
				net_data[hash_index][1] = b_val;
				net_data[hash_index][2] = c_val; 
			}
			else
			{
				net_data[hash_index][0] = parseInt(net_data[hash_index][0]) + parseInt(raw_data[i].volume);
				net_data[hash_index][1] = parseFloat(net_data[hash_index][1] + b_val);
				net_data[hash_index][2] = parseFloat(net_data[hash_index][2] + c_val);
				}
			}
		if (raw_data[i].type=="Sell")
		{
			//find current buy position
			//if not found alert as error
			var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
			hash_index = raw_data[i].symbol+'_B';
			if (net_data[hash_index]==undefined)
			{
				//alert("You can't sell what you dont have!");
			}
			else
			{
				var c_price = parseFloat(net_data[hash_index][2]/net_data[hash_index][0]);
				var b_price = parseFloat(net_data[hash_index][1]/net_data[hash_index][0]);
				var vol_diff = parseInt(net_data[hash_index][0]) - parseInt(raw_data[i].volume);
				if (vol_diff>=0)
				{
					net_data[hash_index][0] = vol_diff;					
					net_data[hash_index][1] = parseFloat(net_data[hash_index][0] * b_price);
					total_cash = total_cash + b_val;
					net_data[hash_index][2] = parseFloat(net_data[hash_index][0] * c_price);
				}
				else
				{
						//alert('can not sell below zero');
				}
			}

		}
		if (raw_data[i].type=="Short")
		{
			//create short position
			var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
			var c_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].c_price); 
			total_cash =  total_cash - b_val;
			hash_index = raw_data[i].symbol+'_S';
			if (net_data[hash_index]==undefined)		
			{
				net_data[hash_index] = new Array();
				net_data[hash_index][0] = raw_data[i].volume;
				net_data[hash_index][1] = b_val;
				net_data[hash_index][2] = c_val; 
			}
			else
			{
				net_data[hash_index][0] = parseInt(net_data[hash_index][0]) + parseInt(raw_data[i].volume);
				net_data[hash_index][1] = parseFloat(net_data[hash_index][1] + b_val);
				net_data[hash_index][2] = parseFloat(net_data[hash_index][2] + c_val);
			}
		}
		if (raw_data[i].type=="Cover")
		{
			//find current short position
			//var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
			hash_index = raw_data[i].symbol+'_S';
			if (net_data[hash_index]==undefined)
			{
				//alert("You can't cover without shorte!");
			}
			else
			{
				var c_price = parseFloat(net_data[hash_index][2]/net_data[hash_index][0]);
				var b_price = parseFloat(net_data[hash_index][1]/net_data[hash_index][0]);
				var vol_diff = parseInt(net_data[hash_index][0]) - parseInt(raw_data[i].volume);
				var b_val = raw_data[i].volume*b_price;
				if (vol_diff>=0)
				{
					net_data[hash_index][0] = vol_diff;					
					net_data[hash_index][1] = parseFloat(net_data[hash_index][0] * b_price);
					total_cash = total_cash + b_val -raw_data[i].volume*(raw_data[i].b_price - b_price);
					net_data[hash_index][2] = parseFloat(net_data[hash_index][0] * c_price);
				}
			}

		}
	}
	//so we have in the end:
	var positions_data = new Object();
	positions_data.net_data = net_data;
	positions_data.total_cash = total_cash;
	positions_data.start_cash = start_cash;
	return positions_data;
}
	
//step 2
function compute_net_positions(p_net_data)
{
	var j=0;
	//$("#net_rows").empty();
	var position_list = new Array();
	var xpnl = 0.0;
	var total_xpnl = 0.0;
	var net_positions = 0.0;
	var net_data = p_net_data.net_data;
	var total_cash = math_util.aux_currency_round(p_net_data.total_cash);
	var start_cash = p_net_data.start_cash;
	var cash_change = parseFloat(total_cash - start_cash);
	for (var k in net_data)	
	{
		if (net_data.hasOwnProperty(k))
		{
			var sym_p=k;
			var volume = net_data[k][0];
			var book_val = math_util.aux_currency_round(net_data[k][1]);
			var avg_price = math_util.aux_currency_round(parseFloat(book_val/volume));
			var car_val = math_util.aux_currency_round(net_data[k][2]);
			if (k.indexOf("_S")>-1)
			{ 
				xpnl = - parseFloat(car_val - book_val);
				net_positions = xpnl + net_positions;
			}
			else 
			{
				xpnl = parseFloat(car_val - book_val);
				net_positions = car_val + net_positions;
			}
			xpnl = math_util.aux_currency_round(xpnl);
			total_xpnl = total_xpnl + xpnl;
			var xrow = new Object();
			xrow.symbol = sym_p;
			xrow.volume = volume;
			xrow.avg_price = avg_price;
			xrow.book_val = book_val;
			xrow.cur_val = car_val;
			xrow.pnl = xpnl;
			//now insert the row if we have non-zero position
			if (volume>0)
			{
				position_list[j] = xrow;
				j= j + 1;
				//$("#net_rows").append(xrow);
			}
		}
	}
	//add cash
	var end_totals = 0.0;
	if (j==0)
	{
		total_xpnl = cash_change;
		var cash_row = new Object();
		cash_row.start_cash = start_cash;
		cash_row.total_cash = total_cash;
		cash_row.cash_change = cash_change;
		//$("#net_rows").append(cash_row);
		end_totals = total_cash;
	}
	else 
	{
		var cash_row = new Object();
		cash_row.start_cash = start_cash;
		cash_row.total_cash = total_cash;
		cash_row.cash_change = '-';
		//$("#net_rows").append(cash_row);
		end_totals = total_cash + net_positions;
	}
	//part 3 - update net value and net profit
	var net_portfolio = new Object();
	net_portfolio.positions = position_list;
	net_portfolio.cash_net = cash_row;
	net_portfolio.total_val = end_totals;
	net_portfolio.total_pnl = total_xpnl;
	return net_portfolio;
}


////////////////////////////////// CHARTS ////////////////////////////////////////////
function draw_charts(p_mode)
	{
		//get transaction list and convert to json/string
		var obj_tlist = namespace_ui.get_portfolio_transactions();
		//get net positions 
		var obj_plist = namespace_ui.get_net_position_summary();
		var csv_summary = namespace_ui.transform_to_csv(obj_tlist);
                //draw all charts
		var selected = $("#chart_select").val();
		if (p_mode==0)
		{
			if (selected=="val_chart")
			{
				namespace_charts.create_value_chart(csv_summary,"container_chart1");
			}
			else 
			{
				namespace_charts.create_performance_chart(csv_summary,"container_chart1");
			}
			namespace_charts.create_positions_chart(obj_plist);
			namespace_charts.create_benchmark_chart(csv_summary);
			namespace_charts.create_risk_chart(csv_summary);
			namespace_charts.create_sector_chart();
		}
		if (p_mode==1)
		{
			namespace_charts.create_risk_chart(csv_summary);
		}
		if (p_mode==2)
		{
			if (selected=="val_chart")
			{
				namespace_charts.create_value_chart(csv_summary,"container_chart1");
			}
			else 
			{
				namespace_charts.create_performance_chart(csv_summary,"container_chart1");
			}
			namespace_charts.create_positions_chart(obj_plist);
		}
		if (p_mode==3)
		{
			recompute_portfolio();
			namespace_charts.create_benchmark_chart(csv_summary);
		}
	}	

