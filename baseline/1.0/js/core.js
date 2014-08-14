var namespace_portfolio = (function()
{
    
    /* Constants */
    var API_URL = "/data_api/:2000";
    var DATA_LOAD_STATES  = ["loading","loading", "ready"];
    /* Private Data */
    var state = {
        load_state: 1,
        list_instruments: [],
        list_benchmarks: [],
        transactions: [],
        positions: [],
        net_positions: [],
        dashboard_rows: [],
        derived_values: []
    };

    /* Private methods */
    function compute_positions()
    {
        //sort transactions
        //now co
    }

    function init_gui_if_ready()
    {
        console.log(state.load_state);
        if (DATA_LOAD_STATES[state.load_state] == "ready")
        {
            console.log(state.list_instruments);
            namespace_gui.init_page(state);
        }
    }
    /* Public methods */
    return {
        initialize :function ()
        {
            //load page data
            $.getJSON(API_URL, { call:"stock_list" }, function (data) 
            {
                state.list_instruments = data;
                state.load_state = state.load_state+1 ;     
                init_gui_if_ready();
            });
        },

        /* data assumed to be clean */
        update_state: function (p_action)
        {
            //validate transactions
            //recompute and return state
            //if transaction is valid
            //add to portfolio and recompute
            //else pop an error message
            state.transactions.push(p_action);
            //update positions
            //state.positions = compute_positions();
            //state.net_positions = compute_net_positions(transactions);
            //update_net values
            namespace_gui.render_page(state);
        }
    };
}) ();

// GUI update code
var namespace_gui = (function() {
    /* Private */
    function create_transaction_row(obj)
    {
        var new_row = '<tr><td class="asset_name">'+ obj.asset
            + '</td><td class="sector_label">' + obj.sector 
            + '</td><td class="buysell_label">' + obj.type
            + '</td><td class="volume_label">'+ obj.volume
            + '</td><td class="book_date">' + obj.book_date
            + '</td><td class="book_price">' + obj.book_price
            + '</td><td class="current_price">'+ obj.last_price
            + '</td><td><button onclick="remove_row_action(this)" class="btn">Remove</button></td></tr>';
       return new_row;
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
            /*    source: page_data.instrument_list,
                select: function(event, ui) {
                    var tdate = $("#date_entry").datepicker("getDate");
                    if (tdate!=null)
                    {
                        var xdate = datetime_util.adjust_date($("#date_entry").datepicker("getDate"));
                        var symbol = ui.item.value;
                        $.get("data_api",{id:symbol, type:"quote", qdate:xdate}, function(data)
                        {
                            $("#price_entry").val(data);
                        });
                    }
                } */
            });
 
            //load instrument_list
            $("#instrument_entry").autocomplete({
                    source:page_state.list_instruments,
                    select:function(event, ui) {
                            var tdate = $("#date_entry").datepicker("getDate");
                            if (tdate!=null){
                                var xdate = datetime_util.adjust_date($("#date_entry").datepicker("getDate"));
                                var symbol = ui.item.value;
                                console.log(symbol);
                            }
                    }            
                }); 
        }
    };
}) ();
