function boot_loader()
{
    /* Initialize UI */
    $("#portfolio_date").datepicker();
    /* bind event handlers */
    $("#cash_add").on('click', namespace_events.deposit_cash)
    /* load page data */
    /* create page state */
    /* create business logic objects */
}

$(document).ready(boot_loader);
