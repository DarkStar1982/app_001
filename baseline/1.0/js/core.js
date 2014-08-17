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
        if (DATA_LOAD_STATES[state.load_state] == "ready")
        {
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
    var API_URL = "/data_api/:2000";
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
