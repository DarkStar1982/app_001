/* ENTRY POINT */
$(document).ready(function(){
    /* Initialize */
    namespace_portfolio.initialize();
    /* bind event handlers */
    $("#cash_add").on('click', namespace_events.deposit_cash)
    $("#transaction_add").on('click', namespace_events.add_trade_row)
});

/* GUI ACTIONS */ 
var namespace_events = (function () {
    return {
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
        }
    }
}) ();

/* BUSINESS LOGIC */
var namespace_portfolio = (function()
{
    /* Constants */
    var API_URL = "/data_api/:2000";
    var DATA_LOAD_STATES  = ["loading","loading", "ready"];
    
    /* Private Data */
    var state = {
        load_state: 1,
        next_id: 0,
        list_instruments: [],
        list_benchmarks: [],
        transactions: [],
        net_data: {},
        time_series: {},
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
                        net_data[hash_value] = [row_data.volume, book_value, last_value];
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
                        net_data[hash_value]= [row_data.volume, book_value, last_value];
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
        namespace_gui.send_log_message("start cash is "+  start_cash, "Info");
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
                                        "pnl": math_util.aux_math_round(profit_or_loss,2)
                    });
                }
                total_pnl = total_pnl + profit_or_loss;
             }
        }
        if (position_list.length == 0)   
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": cash_change };
            var end_totals = total_cash;
            total_pnl = cash_change;
        }
        else
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-" };
            var end_totals = math_util.aux_math_round(total_cash + net_value,2);
        }       
        return {"positions": position_list, "net_cash_row":cash_row, "total_value" : end_totals, "total_pnl": math_util.aux_math_round(total_pnl,2)};
    }
    
    function compute_derived_values()
    {
        //state portfolio value, pnl and benchmark series 
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
            namespace_gui.render_tables(state.net_data, state.transactions);
            // step 2. load profit, risk risk and volatility series, then compute 
            // dashboard and derived values and render portfolio tables and charts
            var transaction_list = JSON.stringify(state.transactions);
            $.post('/data_api/', {call:"time_series", transactions: transaction_list}, function(data)
            {
                var json_data = JSON.parse(data);    
                if (json_data.header.error_code == 0)
                {
                    state.time_series["value_series"] = json_data.value_series;
                    state.time_series["pnl_series"] = json_data.pnl_series;
                    // save data to portfolio state....
                    // do all the computations
                    // draw charts
                    //
                    console.log(json_data); 
                    state.derived_values = compute_derived_values(); 
                    namespace_gui.render_derived(state);
                    namespace_gui.render_charts(state);
                }
                else 
                {
                    namespace_gui.send_log_message("Failed to receive portfolio time series data", "System");
                    namespace_gui.send_log_message(json_data, "System");
                }
            });
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
        if (p_action.type == "Deposit" || p_action.type == "Widthdraw")
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
        function_call();
    } 

    function init_gui_if_ready()
    {
        if (DATA_LOAD_STATES[state.load_state] == "ready")
        {
            namespace_gui.init_page(state);
        }
    }
    /* Public methods */
    return {
        /* Load required page data:
        * - Instruments list
        * - Benchmarks list  
        * -Set values for empty portfolio  */
        initialize :function ()
        {
            $.getJSON(API_URL, { call:"stock_list" }, function (data) 
            {
                state.list_instruments = data;
                state.load_state = state.load_state+1 ;     
                init_gui_if_ready();
            });
            //create empty portfolio
            state.net_data = {
                "net_cash_row": {
                    "start_cash" : 0.0,
                    "total_cash" : 0.0,
                    "cash_chage" : 0.0,
                },
                "positions" :[],
                "total_value" : 0.0,
                "total_pnl" : 0.0
            }
        },

        /* add transaction to porfolio
         * 1. check transaction - can have incompete information, so load missing data
         * 2. verify that portfolio is consistent if this transaction is added  
         * 3. recompute entire portfolio and redraw page
         *  3.1 update positions
         *  3.2 update net values
         *  3.3 update derived data 
         * 4. update page DOM
         * 5. draw charts */
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
            }
        }
    }
}) ();

// GUI interactions code
var namespace_gui = (function() {
    var API_URL = "/data_api/:2000";
     /* Private */
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
            + '</td><td><button onclick="namespace_events.remove_trade_row(this)" class="btn">Remove</button></td></tr>';
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

    /* Public Interface */ 
    return {
        render_charts: function(chart_data)
        {
            //chart_data.time_series.value_series
            var display_mode = $("#perf_select").val();
            var flag_mode = $("#flags_selected").prop("checked");
            namespace_graphs.render_value_chart(chart_data.time_series.pnl_series, "#container_chart1", display_mode, flag_mode)
        },

        //dashboard and analytics
        render_derived: function(derived_data)
        {
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

            /* init instrument entry datetime picker" */
            $("#date_entry").datepicker({
                onSelect: function(dateText, inst) {
                    var symbol = $("#instrument_entry").val();
                    update_price_entry(symbol);
                }
            });
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
