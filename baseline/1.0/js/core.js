var namespace_portfolio = (function()
{
    /* Private dataa */
    var state = {
        transactions: [],
        positions: [],
        net_positions: []
    };

    /* Private methods */
    function compute_positions()
    {
        //sort transactions
        //now co
    }

    /* Public methods */
    return {
        //data assumed to be clean
        update_state: function (p_action)
        {
            //recompute and return state
            //if transaction is valid
            //add to portfolio and recompute
            //else pop an error message
            state.transactions.push(p_action);
            //update positions
            //state.positions = compute_positions();
            //state.net_positions = compute_net_positions(transactions);
            //update_net values
            return state;
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
        }
    };
}) ();
