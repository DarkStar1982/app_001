var namespace_events = (function () {
    return {
        deposit_cash: function()
        {
            var action = {
                //cash_value: $("#portfolio_cash").val(), 
                //deposit_date: $("#portfolio_date").datepicker("getDate"),
                type = "cash_deposit"
            };
            namespace_gui.render_page(namespace_portfolio.update_state(action)); 
        }
    };
}) ();
