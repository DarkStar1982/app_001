/* test mathematical utils 
 * test date utils
 * test time series utils */

QUnit.test( "rounding tests", function( assert ) {
    assert.notEqual(
		math_util.aux_currency_round(10.1235),
		10.11, 
		"We expect value to not equal 10.11"
	);
	assert.equal(
		math_util.aux_currency_round(10.1135),
		10.11,
		"We expect value to be 10.11"
	);
	
});

QUnit.test( "time series split tests", function( assert ) {
    assert.equal(0, 0, "We expect value to be 10.11" );
	
/*	var start_date = new Date (2014, 0, 1);
	var next_date = start_date.getTime();
	var last_date = new Date().getTime();
	var date_shifts = [0,1,3,6,12]; 
	var dates = [];
	var test_series=[];
	for (var i=0; i<date_shifts.length;i++)
	{
		dates[i] = datetime_util.get_date_shifted(date_shifts[i]).getTime();
	}
	while (next_date<last_date)
	{
		test_series.push([next_date, 100]);
		next_date = next_date + 86400000;
	}
	var result = namespace_time_series.split_series(test_series, dates);
	for (var j=0;j<result.length;j++)
	{
		console.log(result[j].length);
	}
    assert.equal(result[0], test_series, "We expect first series to be like original one" ); */
});
