var namespace_portfolio = (function()
{
    var portfolio_state;
    return {
        update_state: function (p_action)
        {
            //recompute
            return p_action;
        }
    };
}) ();

var namespace_gui = (function() {
    return {
        render_page: function(portfolio_object)
        {
            alert (porfolio_object);
        }
    };
}) ();
