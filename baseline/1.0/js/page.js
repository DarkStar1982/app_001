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
                last_price: 1.0
            };
            namespace_portfolio.update_state(new_transaction);
        },
        add_trade_row: function()
        {
            var new_transaction = {
                volume: $("#amount_entry").val(),
                book_date: datetime_util.adjust_date($("#date_entry").datepicker("getDate")),
                type: $("#trade_type").val(),
                asset: $("#instrument_entry").val(),
                sector: undefined,
                book_price: $("#price_entry").val(),
                last_price: undefined,
            };
            namespace_portfolio.update_state(new_transaction);
        }
    }
}) ();
