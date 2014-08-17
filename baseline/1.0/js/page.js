//Entry point boot loader
$(document).ready(function(){
    /* Initialize */
    namespace_portfolio.initialize();
    /* bind event handlers */
    $("#cash_add").on('click', namespace_events.deposit_cash)
    $("#transaction_add").on('click', namespace_events.add_trade_row)
});

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
            namespace_portfolio.update_state(new_transaction);
        },
        add_trade_row: function()
        {
            alert("Test");
            var new_transaction={};
            //namespace_portfolio.update_state(_new_transaction);
        }
    }
}) ();
