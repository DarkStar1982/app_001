/* library test */
QUnit.test( "rounding success", function( assert ) {
	var expected_value = 10.11;
	var actual_value =  math_util.aux_currency_round(10.1235);
    assert.equal(actual_value, expected_value, "We expect value to be 10.11" );
});
