/*   MATH functions module */
var math_util = (function (){
	/*** private ****/
	function extract_data(p_data)
	{
        	var r_data =[];
        	for (var i=0; i<p_data.length;i++)
        	{
                	r_data[i] = p_data[i][1];
       		}
        	return r_data;
	}


	function transform_data(p_data)
	{
        	var real_data = new Array();
		var delta_data = new Array();
		for (var i=0; i<p_data.length;i++)
		{
			real_data[i] = p_data[i][1];
		}
                for (var i=0; i<real_data.length-1;i++)
                {
			var ratio = real_data[i+1]/real_data[i] - 1.0;
                        delta_data[i] = ratio;
                }
                return delta_data;
        }

	function stat_compute_mean(p_data)
	{
		var sum = 0.0
        	for (var i=0; i<p_data.length;i++)
        	{
			sum = sum + p_data[i];
		}
		var mean = sum / p_data.length;
        	return mean;
	}

	function aux_compute_covariance (p_data_a, p_data_b)
	{
		var x_a = extract_data(p_data_a);
		var x_b = extract_data(p_data_b);
		var mean_a=stat_compute_mean(x_a);
		var mean_b=stat_compute_mean(x_b);
		var min_length = math_util.aux_compute_min(x_a.length,x_b.length);
		var c_sum =0.0;
		for (var i=0; i<min_length;i++)
		{
			c_sum = c_sum + (x_a[i] - mean_a)*(x_b[i]-mean_b);
		}
		var x_result = c_sum / (min_length)
        	return x_result;
	}

	function aux_compute_variance (p_data)
	{
		var x_data = extract_data(p_data);
		var mean = stat_compute_mean(x_data);
		var new_sum = 0.0;
		for (var i=0; i<x_data.length;i++)
		{
			diff = x_data[i] - mean;
			new_sum = new_sum +  Math.pow(diff,2);
		}
		var var_x = new_sum/(x_data.length-1.0);
		return var_x;
	}

	/*** public ***/
	return {
		aux_currency_round: function(p_value) {
        		return (Math.round(p_value*100) / 100.0);
		},
		aux_math_round: function(p_value, p_digits)
		{
			var r_val = Math.pow(10,p_digits);
			return (Math.round(p_value*r_val) / r_val);
		},
		aux_compute_min: function(a,b) {
			if (a<b) return a;
			else if (a>b) return b;
			else return a;
		},
		compute_stdev: function(p_data){
			var x_data = transform_data(p_data);
			var mean = stat_compute_mean(x_data);
			var new_sum = 0.0;
			for (var i=0; i<x_data.length;i++)
			{
				diff = x_data[i] - mean;
				new_sum = new_sum +  Math.pow(diff,2);
			}
			var std_dev = (Math.sqrt(new_sum/x_data.length)*(Math.sqrt(365.25)));
			return this.aux_currency_round(std_dev);
		},
		compute_beta: function(p_data_a, p_data_b){
			var covariance = aux_compute_covariance(p_data_a,p_data_b);
			var variance = aux_compute_variance(p_data_b);
			return this.aux_currency_round(covariance/variance);
		},
		compute_annualized: function(p_percentage, p_date_start)
		{
			var new_date = new Date(p_date_start);
			var time_days = datetime_util.get_diff_milliseconds(new_date) / 86400000.0;
			var ret = Math.pow((p_percentage/100.0+ 1.0),(365.25 /time_days)) - 1.0;
			return this.aux_currency_round(ret*100.0);
		},
		compute_taylor: function()
		{
		},
		compute_jensen: function()
		{
		},
		compute_sharpe: function()
		{
		}

	};
})();

/* DATE and TIME module */

var datetime_util = (function () {
	
	return {
		date_distance: function (a,b) 
		{
			var ms_per_day = 1000 * 60 * 60 * 24;
			var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
			var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
			return Math.abs(Math.floor((utc2 - utc1) / ms_per_day));
		},

		//transform date object into YYYY-MM-DD string
		adjust_date: function(p_date)
		{
			var month=p_date.getMonth()+1;
        		if (month < 10)
        		{
                		month = '0'+month;
        		}
        		var xdate = p_date.getDate();
		        if (xdate < 10)
       			{
                		xdate = '0'+xdate;
        		}
			var sdate = p_date.getFullYear()+'-'+month+'-'+xdate;
        		return sdate;
		},
		//self-explanatory
		get_yesterday_date: function()
		{
        		var today= new Date();
        		var yesterday = new Date(today);
        		yesterday.setDate(today.getDate()-1);
        		return yesterday;
		},
		//return difference between input date and today in milliseconds      
		get_diff_milliseconds: function(p_date)
		{
        		var t = new Date();
        		var x1 = t.getTime();
       			var x2 = p_date.getTime();
        		var y = x1 - x2
        		return y;
		},
		// if delta > 0 get date with deltasubtracted from today
		// else return 1st January of the same year 
		// known bug here  - doesn't handle leap years
		get_date_shifted: function(p_delta, p_flag_format)
		{
        		var today = new Date();
			if ( p_delta>0 )
			{
				var month = today.getMonth();
				var year = today.getFullYear();
				var xdate = today.getDate();
				var year_diff = Math.floor(p_delta/12);
				var month_diff = p_delta % 12;
				year = year - year_diff;
				month = month - month_diff;
				if (month < 0)
				{
					year = year - 1;
					month = 11 + month;
				}
				if ((xdate>28) && (month == 1))
				{
					xdate = 28;
				}
				if ((xdate > 30) && ((month == 3)||(month==5)||(month=8)||(month==10)))
				{
					xdate = 30;
				}
				var new_date =  new Date(year,  month, xdate);
				return new_date;
        		}
			else
        		{
                		var new_date = new Date(today.getFullYear(), 0, 1);
                		return new_date;
        		}
		},
		convert_date_to_ms: function(p_date)
		{
			var xdate = new Date(p_date); // some mock date
        		var milliseconds = xdate.getTime();
        		return milliseconds;
		}
	};
}) ();

/* Excel 2003 function equivalents module */
var namespace_xls = (function (){
	
	return {
		/* Original algorithm by Peter John Acklam, 2003-2010 */
		norminv: function(p, mu, sigma)
		{
			//polynomial approximation coefficients
			var a1 = -39.6968302866538;
        		var a2 = 220.946098424521;
        		var a3 = -275.928510446969;
        		var a4 = 138.357751867269;
        		var a5 = -30.6647980661472;
        		var a6 = 2.50662827745924;
	
        		var b1 = -54.4760987982241;
        		var b2 = 161.585836858041;
        		var b3 = -155.698979859887;
        		var b4 = 66.8013118877197;
        		var b5 = -13.2806815528857;

        		var c1 = -7.78489400243029E-03;
        		var c2 = -0.322396458041136;
        		var c3 = -2.40075827716184;
        		var c4 = -2.54973253934373;
        		var c5 = 4.37466414146497;
        		var c6 = 2.93816398269878;

        		var d1 = 7.78469570904146E-03;
        		var d2 = 0.32246712907004;
        		var d3 = 2.445134137143;
        		var d4 = 3.75440866190742;
			
			// define values 
        		var pLow = 0.02425;
        		var pHigh = 1.0 - pLow;
        		var q;
        		var x = 0;
        		if (p <= 0.0) 
            			p = pLow;
        		if (p >= 1.0)
            			p = pHigh;
			//now compute
        		if (p < pLow)
        		{
           			q = Math.Sqrt(-2.0 * Math.Log(p));
            			x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / 
					 ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        		}
        		else if (p <= pHigh)
        		{
            			q = p - 0.5;
            			var r = q * q;
            			x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
					(((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        		}
        		else if (p < 1.0)
        		{
            			q = Math.Sqrt(-2.0 * Math.Log(1 - p));
            			x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / 
					((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        		}

       			return (sigma*x + mu);
		}	
	}
}) (); 
