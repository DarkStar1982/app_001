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
                last_price: 1.0,
                flags: ['first']
            };
            namespace_gui.render_page(namespace_portfolio.update_state(new_transaction)); 
        }
    };
}) ();
