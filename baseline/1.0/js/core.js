var namespace_portfolio = (function()
{
    /* Private dataa */
    var state = {
        transactions: [],
        positions: [],
        net_positions: []
    };

    /* Private methods */
    function recompute_portfolio()
    {
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
            var transactions = get_portfolio_transactions();
            state.positions = compute_positions(transactions);
            state.net_positions = compute_net_positions(transactions);
            //update_net values
            alert(state.transactions[0].deposit_date);
            return state;
        }
    };
}) ();

var namespace_gui = (function() {
    return {
        render_page: function(portfolio_object)
        {
            //add positions
            //alert (portfolio_object.cash_value);
        }
    };
}) ();
