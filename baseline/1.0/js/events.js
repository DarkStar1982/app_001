var namespace_events = (function () {
    return {
        deposit_cash: function()
        {
            var new_transaction = {
                cash_value: $("#portfolio_cash").val(), 
                deposit_date: datetime_util.adjust_date($("#portfolio_date").datepicker("getDate")),
                type: "cash_deposit",
                flags: ['first']
            };
            namespace_gui.render_page(namespace_portfolio.update_state(new_transaction)); 
        }
    };
}) ();
