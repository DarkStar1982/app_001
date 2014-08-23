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
        positions: [],
        net_positions: [],
        dashboard_rows: [],
        derived_values: []
    };

    /* Private methods */
    function recompute_portfolio()
    {
        //now I have list of transaction...                                
        //  1. compute position values
        var positions  = compute_positions();
        //  2. net values
        //  3. dashboard and derived values
        //  4. risk and volatility series
        //sort transactions
        namespace_gui.render_page(state);
    }

    function compute_positions()
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
            var b_val = parseFloat(raw_data[i].volume)*parseFloat(raw_data[i].b_price);
            hash_index = raw_data[i].symbol+'_B';
            if (net_data[hash_index]==undefined)
            {
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
                }
            }

        }
        if (raw_data[i].type=="Short")
        {
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
            hash_index = raw_data[i].symbol+'_S';
            if (net_data[hash_index]==undefined)
            {
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
    var positions_data = new Object();
    positions_data.net_data = net_data;
    positions_data.total_cash = total_cash;
    positions_data.start_cash = start_cash;
    return positions_data;
    }
    
    function get_next_id()
    {
        state.next_id = state.next_id + 1;
        return state.next_id;
    }

    /* postprocess transaction if neccessary*/
    function add_transaction(p_action, function_call)
    {
        p_action.gui_id = get_next_id();
        console.log(p_action);
        switch (p_action.type)
        {
            case "Buy":
            case "Sell":
            case "Short":
            case "Cover":
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
                                state.transactions.push(p_action);
                                function_call();
                            }
                            else {
                                console.log(data);
                            }
                        });
                    }
                    else {
                        console.log(data);
                    }
                });
                break;
            case "Deposit":
            case "Withdraw":
                state.transactions.push(p_action);
                function_call();
                break;
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
        /* Load required page data */
        initialize :function ()
        {
            $.getJSON(API_URL, { call:"stock_list" }, function (data) 
            {
                state.list_instruments = data;
                state.load_state = state.load_state+1 ;     
                init_gui_if_ready();
            });
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
                    add_transaction(p_data, recompute_portfolio); 
                    break;
                case "remove_record":
                    remove_transaction(p_data, recompute_portfolio);
                    break;
            }
        }
    }
}) ();

// GUI update code
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

    function update_price_entry(p_symbol)
    {
        var xdate = datetime_util.adjust_date($("#date_entry").datepicker("getDate"));
        $.getJSON(API_URL, {instrument:p_symbol, call:"quote", datetime:xdate}, function(data)
        {
            if (data.header.error_code == 0)
                $("#price_entry").val(math_util.aux_math_round(data.contents.price,2));
            else 
                console.log(data);
        });
    }
    /* Public */ 
    return {
        render_page: function(portfolio)
        {
            //depending on state....
            $("#matrix").empty();
            for (var i=0; i <portfolio.transactions.length; i++)
            {
                  var str_row = create_transaction_row(portfolio.transactions[i]);
                  $("#matrix").append(str_row);
            }
            //add positions
            //add net positions
            //render charts and dashboard
            //alert (portfolio_object.cash_value);
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
        }
    };
}) ();
