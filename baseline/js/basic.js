$(document).ready(function(){
  namespace_iplanner.init_page_state();
  //page event handlers
  $("#get_score").on('click', function(e){
    namespace_iplanner.get_profile();
  });

  $("#show_performance").on('click', function(e){
    $('a[href=#Tab3]').tab('show');
  });

});

var namespace_marketdata = (function(){
  var stock_database ={
    "VOO": { ticker:"VOO", currency: "USD", type: "EQ", risk_rank: 1, desc: "S&P 500" },
    "OEF": { ticker:"OEF", currency: "USD", type: "EQ", risk_rank: 1, desc: "S&P 100" },
    "IYY": { ticker:"IYY", currency: "USD", type: "EQ", risk_rank: 1, desc: "Dow Jones" },
    "QQQ": { ticker:"QQQ", currency: "USD", type: "EQ", risk_rank: 1, desc: "NASDAQ 100" },
    "IJR": { ticker:"IJR", currency: "USD", type: "EQ", risk_rank: 3, desc: "S&P 600 Small Cap" },
    "IJH": { ticker:"IJH", currency: "USD", type: "EQ", risk_rank: 2, desc: "S&P 400 Mid Cap" },
    "ELR": { ticker:"ELR", currency: "USD", type: "EQ", risk_rank: 1, desc: "S&P Large Cap" },
    "IVW": { ticker:"IVW", currency: "USD", type: "EQ", risk_rank: 3, desc: "S&P Growth" },
    "IVE": { ticker:"IVE", currency: "USD", type: "EQ", risk_rank: 1, desc: "S&P Value" },
    "IWV": { ticker:"IWV", currency: "USD", type: "EQ", risk_rank: 3, desc: "Russel 3000" },
    "UUP": { ticker:"UUP", currency: "USD", type: "EQ", risk_rank: 3, desc: "Currencies" },
    "DBC": { ticker:"DBC", currency: "USD", type: "EQ", risk_rank: 3, desc: "Commodities" },
    "BIL": { ticker:"BIL", currency: "USD", type: "FI", risk_rank: 1, desc: "CASH (USD Money Market)" },
    "PFF": { ticker:"PFF", currency: "USD", type: "FI", risk_rank: 2, desc: "S&P US Preffered stock" },
    "DVY": { ticker:"DVY", currency: "USD", type: "FI", risk_rank: 2, desc: "DJ US Select Dividend" },
    "AGG": { ticker:"AGG", currency: "USD", type: "FI", risk_rank: 1, desc: "US Aggregate Bond" },
    "IEI": { ticker:"IEI", currency: "USD", type: "FI", risk_rank: 1, desc: "US 3-7yr Treasury Bond" },
    "IEF": { ticker:"IEF", currency: "USD", type: "FI", risk_rank: 1, desc: "US 7-10yr Treasury Bond" },
    "TLH": { ticker:"TLH", currency: "USD", type: "FI", risk_rank: 1, desc: "US 10-20yr Treasury Bond" },
    "TLT": { ticker:"TLT", currency: "USD", type: "FI", risk_rank: 1, desc: "US 20+yr Treasury Bond" },
    "SHY": { ticker:"SHY", currency: "USD", type: "FI", risk_rank: 1, desc: "US 1-3yr Treasury Bond" },
    "HYG": { ticker:"HYG", currency: "USD", type: "FI", risk_rank: 3, desc: "US High Yield" },
    "XIC.TO": { ticker:"XIC.TO", currency: "CAD", type: "EQ", risk_rank: 1, desc: "S&P/TSX Composite" },
    "XCS.TO": { ticker:"XCS.TO", currency: "CAD", type: "EQ", risk_rank: 3, desc: "S&P/TSX Small Cap" },
    "XMD.TO": { ticker:"XMD.TO", currency: "CAD", type: "EQ", risk_rank: 2, desc: "S&P/TSX Mid Cap" },
    "XIU.TO": { ticker:"XIU.TO", currency: "CAD", type: "EQ", risk_rank: 1, desc: "S&P/TSX Large Cap" },
    "XCV.TO": { ticker:"XCV.TO", currency: "CAD", type: "EQ", risk_rank: 1, desc: "S&P/TSX Value" },
    "XCG.TO": { ticker:"XCG.TO", currency: "CAD", type: "EQ", risk_rank: 3, desc: "S&P/TSX Growth" },
    "XRE.TO": { ticker:"XRE.TO", currency: "CAD", type: "EQ", risk_rank: 2, desc: "S&P/TSX Capped REIT" },
    "XBB.TO": { ticker:"XBB.TO", currency: "CAD", type: "FI", risk_rank: 1, desc: "iShares Universe Bond" },
    "XCB.TO": { ticker:"XCB.TO", currency: "CAD", type: "FI", risk_rank: 2, desc: "iShares Corporate Bond Index" },
    "VSC.TO": { ticker:"VSC.TO", currency: "CAD", type: "FI", risk_rank: 3, desc: "Canadian Short-Term Corporate Bond Index ETF" },
    "XRB.TO": { ticker:"XRB.TO", currency: "CAD", type: "FI", risk_rank: 1, desc: "S&P/TSX Real Return Bond" },
    "CMR.TO": { ticker:"CMR.TO", currency: "CAD", type: "FI", risk_rank: 1, desc: "CASH (CAD Money Market)" },
    "EFA": { ticker:"EFA", currency: "INTL", type: "EQ", risk_rank: 3, desc: "MSCI EAFE" },
    "IEV": { ticker:"IEV", currency: "INTL", type: "EQ", risk_rank: 3, desc: "S&P Europe 350" },
    "AIA": { ticker:"AIA", currency: "INTL", type: "EQ", risk_rank: 3, desc: "S&P Global Asia 50" },
    "EFV": { ticker:"EFV", currency: "INTL", type: "EQ", risk_rank: 3, desc: "MSCI EAFE Value" },
    "EFG": { ticker:"EFG", currency: "INTL", type: "EQ", risk_rank: 3, desc: "MSCI EAFE Growth" },
    "VEE": { ticker:"VEE", currency: "INTL", type: "EQ", risk_rank: 3, desc: "FTSE Emerging Markets Index ETF" },
    "VGG": { ticker:"VGG", currency: "USD", type: "FI", risk_rank: 1, desc: "US Dividend Appreciation Index ETF" },
    "VUN": { ticker:"VUN", currency: "USD", type: "FI", risk_rank: 1, desc: "US Total Market Index Bonds" },
  };

  return {
    get_data :function(p_symbol)
    {
      return stock_database[p_symbol];
    }
  }

}) ();

var namespace_iplanner = (function(){

  function compute_profile_score(p_rank_value)
  {
    var investor_profile = {};
    investor_profile["score"] = p_rank_value;
    if (p_rank_value<16)
    {
      investor_profile["title"] = "Conservative&nbsp;Investor";
      investor_profile["Description"] = "You primary objective is the preservation of capital with minimal risk."
        + "You can allow only short amount of time for portfolio to recover from negative period";
    }
    else if (p_rank_value<24)
    {
      //balanced
      investor_profile["title"] = "Income&nbsp;Investor";
      investor_profile["Description"] = "You are willing to tolerate some market fluctuations for the better returns.";
    }
    else if ((p_rank_value>=24)&&(p_rank_value<=30))
    {
      //growth
      investor_profile["title"] = "Balanced&nbsp;Investor";
      investor_profile["Description"] = "You are willing to tolerate market fluctuations and more time for the market to recover value."
        + "You have some experience with investments and you understand tradeoff betwee market risks and returns.";
    }
    else if (p_rank_value>30)
    {
      //aggressive growth
      investor_profile["title"] = "Growth&nbsp;Investor";
      investor_profile["Description"] = "You are a knowledgeable investor and not concerned about short-term fluctuations"
        + "You are willing to wait longer time to maximize your profits.";
    }
    return investor_profile;
  }

  function compute_portfolio_data(score)
  {
    var error_obj = {
      name: 'Proprietary or Undetectable',
      y: 0.2,
      dataLabels: { enabled: false }
    };
    var p_data = {};
    //append charts here
    if (score<16)
    {
      p_data["basic"] = [['Cash',0.00],['Equity',0.00],['Fixed Income', 100.00],error_obj];
      p_data["plus"] = [['Cash',0.00],['Equity',0.00],['Fixed Income', 100.00],error_obj];
    }
    else if (score<24)
    {
      p_data["basic"] = [['Cash',5.00],['Equity',20.00],['Fixed Income', 75.00],error_obj];
      p_data["plus"] = [['Cash',5.00],['Equity',25.00],['Fixed Income', 70.00],error_obj];
    }
    else if ((score>=24)&&(score<=30))
    {
      p_data["basic"] = [['Cash',5.00],['Equity',40.00],['Fixed Income', 55.00],error_obj];
      p_data["plus"] = [['Cash',5.00],['Equity',45.00],['Fixed Income', 50.00],error_obj];
    }
    else if (score>30)
    {
      p_data["basic"] = [['Cash',5.00],['Equity',70.00],['Fixed Income', 25.00],error_obj];
      p_data["plus"] = [['Cash',5.00],['Equity',75.00],['Fixed Income', 20.00],error_obj];
    }
    return p_data;
  }

  function create_detailed_series(p_score)
  {
    var error_obj = {
      name: 'Proprietary or Undetectable',
      y: 0.2,
      dataLabels: { enabled: false }
    };
    var p_data_extended = {};
    //append charts here
    if (p_score<16)
    {
      p_data_extended["basic"] = [
        ['AGG', 40.0],
        ['IEI', 10.0],
        ['TLT', 10.0],
        ['SHY', 5.0],
        ['HYG', 5.0],
        ['XBB.TO',30],
        error_obj
      ];
      p_data_extended["plus"] = [
        ['AGG', 30.0],
        ['IEI', 10.0],
        ['TLT', 10.0],
        ['SHY', 5.0],
        ['HYG', 5.0],
        ['XBB.TO',40],
        error_obj
      ];
    }
    return p_data_extended;
  }

  function compute_chart_series(p_data)
  {
    var p_data_ex = {"basic":[], "plus":[]}
    for (var i=0;i<p_data["basic"].length-1;i++)
    {
      if (p_data["basic"][i][1] > 0.0)
        p_data_ex["basic"].push(p_data["basic"][i]);
      if (p_data["plus"][i][1] > 0.0)
        p_data_ex["plus"].push(p_data["plus"][i]);
    }
    p_data_ex["basic"].push(p_data["basic"][p_data.length-1]);
    p_data_ex["plus"].push(p_data["plus"][p_data.length-1]);
    return p_data_ex;
  }

  function create_charts_simple(p_data)
  {
    var chart_objs = [{
      title : { text : 'Basic'},
      legend : {enabled:false},
      series: [{
            type: 'pie',
            name: 'Portfolio share',
            innerSize: '50%',
            data:p_data["basic"]
        }]
    },
    {
      title : { text : 'Plus'},
      legend : {enabled:false},
      series: [{
            type: 'pie',
            name: 'Portfolio share',
            innerSize: '50%',
            data: p_data["plus"]
          }]
    }];
    return chart_objs;
  }

  function append_tables_advanced(p_data)
  {
    console.log(p_data);
  }

  return {
    init_page_state: function()
    {
      //page init actions
      namespace_graphs.init_chart_style();
      $("#show_performance").hide();
      $("#table_1").hide();
      $("#table_2").hide();
      $("#table_3").hide();
      $("#table_4").hide();
    },

    get_profile: function()
    {
      var net_value =  parseInt($("#age").val())
        + parseInt($("#net_assets").val())
        + parseInt($("#knowledge").val())
        + parseInt($("#duration").val())
        + parseInt($("#goal").val())
        + parseInt($("#max_drop").val())
        + parseInt($("#recover").val())
        + parseInt($("#profit_or_loss").val());
      var p_obj = compute_profile_score(net_value);
      var template='<table class="table table-bordered">'+
      '<tr><th>Score</th><th>Your&nbsp;Investment&nbsp;Profile</th><th>Notes</th><th>Actions</th></tr>'+
      '<tr><td id="p_score">'
        + p_obj["score"] + '</td><td>' + p_obj["title"] + '</td><td>'
        + p_obj["Description"]
        + '</td><td><button class="btn btn-default" onclick="namespace_iplanner.show_portfolio_selection()">Show Investment Plans</button></td></tr></table>';
      $("#investor_type").empty();
      $("#investor_type").append(template);
    },

    show_portfolio_selection: function()
    {
      var score = $("#p_score").text();
      var p_data = compute_portfolio_data(score);
      var chart_data = compute_chart_series(p_data);
      var charts_simple = create_charts_simple(chart_data);
      var chart_data_advanced = create_detailed_series(score);
      var charts_advanced = create_charts_simple(chart_data_advanced);
      $("#chart_container_1").highcharts('Chart', charts_simple[0]);
      $("#chart_container_2").highcharts('Chart', charts_simple[1]);
      $("#chart_container_22").highcharts('Chart', charts_advanced[1]);
      $("#chart_container_12").highcharts('Chart', charts_advanced[0]);
      //append tables simple
      append_tables_advanced(chart_data_advanced);
      $("#table_1").empty();
      $("#table_1").append('<tr><td>Cash</td><td>'+p_data["basic"][0][1]+'%</td></tr>');
      $("#table_1").append('<tr><td>Equity</td><td>'+p_data["basic"][1][1]+'%</td></tr>');
      $("#table_1").append('<tr><td>Fixed Income</td><td>'+p_data["basic"][2][1]+'%</td></tr>');
      $("#table_2").empty();
      $("#table_2").append('<tr><td>Cash</td><td>'+p_data["plus"][0][1]+'%</td></tr>');
      $("#table_2").append('<tr><td>Equity</td><td>'+p_data["plus"][1][1]+'%</td></tr>');
      $("#table_2").append('<tr><td>Fixed Income</td><td>'+p_data["plus"][2][1]+'%</td></tr>');
      //set visibilty
      $('a[href=#Tab2]').tab('show');
      $("#show_performance").show();
      $("#table_1").show();
      $("#table_2").show();
    }
  }
}) ();
