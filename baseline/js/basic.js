$(document).ready(function(){
  namespace_iplanner.init_page_state();
  //page event handlers
  $("#get_score").on('click', function(e){
    namespace_iplanner.get_profile();
  });

  $("#show_performance").on('click', function(e){
    namespace_iplanner.show_performance_view();
  });

  namespace_marketdata.load_data();
});

var namespace_marketdata = (function(){
  var API_URL = "/data_api";

  var stock_database ={};

  return {
    get_data: function(p_symbol)
    {
      return stock_database[p_symbol];
    },

    load_data: function()
    {
      $.getJSON(API_URL,  {call:"stock_list",}, function(data)
      {
        var stock_list = data.contents.stocks;
        for (var i=0;i<stock_list.length;i++)
        {
            stock_database[stock_list[i]["value"]] = {
              "ticker" : stock_list[i]["value"],
              "currency" : stock_list[i]["currency"],
              "type" : stock_list[i]["type"],
              "desc" : stock_list[i]["desc"]
            }
        }
      });
    }
  }

}) ();

var namespace_portfolio_aux = (function(){
  return {
    compute_net_data: function(position_data)
    {
        var total_cash = position_data.total_cash;
        var start_cash = position_data.start_cash;
        var cash_change = parseFloat(total_cash - start_cash);
        var position_list =[];
        var profit_or_loss = 0.0;
        var net_profit = 0.0;
        var total_pnl = 0.0;
        var net_value = 0.0;
        var net_data = position_data.net_positions;
        for (var k in net_data)
        {
            if (net_data.hasOwnProperty(k))
            {
                var avg_price = parseFloat(net_data[k][1] / net_data[k][0]);
                if (k.indexOf("_S")>-1)
                {
                    profit_or_loss = - parseFloat(net_data[k][2] - net_data[k][1]);
                    net_value = profit_or_loss + net_value;
                }
                else
                {
                    profit_or_loss = parseFloat(net_data[k][2] - net_data[k][1]);
                    net_value = net_data[k][2] + net_value;
                }
                if (net_data[k][0]>0)
                {
                    position_list.push({"symbol": k,
                                        "volume": net_data[k][0],
                                        "price_avg": math_util.aux_math_round(avg_price,2),
                                        "book_value": math_util.aux_math_round(net_data[k][1],2),
                                        "last_value": math_util.aux_math_round(net_data[k][2],2),
                                        "pnl": math_util.aux_math_round(profit_or_loss,2),
                                        "pnl_rel":math_util.aux_math_round(profit_or_loss / net_data[k][1] * 100.0, 2),
                                        "sector":net_data[k][3]
                    });
                }
                total_pnl = total_pnl + profit_or_loss;
             }
        }
        if (position_list.length == 0)
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-"};
            var end_totals = total_cash;
            total_pnl = "-";
        }
        else
        {
            var cash_row = { "start_cash": start_cash, "total_cash":total_cash, "cash_change": "-" };
            var end_totals = math_util.aux_math_round(total_cash + net_value,2);
            total_pnl = math_util.aux_math_round(total_pnl,2);
        }
        return {"positions": position_list, "net_cash_row":cash_row, "total_value" : end_totals, "total_pnl": total_pnl};
    },

    compute_position_data: function(p_transactions)
    {
        var total_cash = 0.0;
        var start_cash = 0.0;
        var net_data = new Object();
        for (var i=0;i<p_transactions.length;i++)
        {
            var row_data = p_transactions[i];
            switch (row_data.type)
            {
                case "Deposit":
                    total_cash = total_cash + parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    start_cash = total_cash;
                    break;
                case "Withdraw":
                    total_cash = total_cash - parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    break;
                case "Buy":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var last_value = parseFloat(row_data.volume)*parseFloat(row_data.last_price);
                    total_cash =  total_cash - book_value;
                    var hash_value = row_data.asset+'_B';
                    if (net_data[hash_value]==undefined)
                    {
                        net_data[hash_value] = [row_data.volume, book_value, last_value, row_data.sector];
                    }
                    else
                    {
                        net_data[hash_value][0] = parseInt(net_data[hash_value][0]) + parseInt(row_data.volume);
                        net_data[hash_value][1] = parseFloat(net_data[hash_value][1] + book_value);
                        net_data[hash_value][2] = parseFloat(net_data[hash_value][2] + last_value);
                    }
                    break;
                case "Sell":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var hash_value = row_data.asset+'_B';
                    if (net_data[hash_value] != undefined)
                    {
                        var last_price = parseFloat(net_data[hash_value][2]/net_data[hash_value][0]);
                        var book_price = parseFloat(net_data[hash_value][1]/net_data[hash_value][0]);
                        var volum_diff = parseInt(net_data[hash_value][0]) - parseInt(row_data.volume);
                        if (volum_diff>=0)
                        {
                            total_cash = total_cash + book_value;
                            net_data[hash_value][0] = volum_diff;
                            net_data[hash_value][1] = parseFloat(net_data[hash_value][0] * book_price);
                            net_data[hash_value][2] = parseFloat(net_data[hash_value][0] * last_price);
                        }
                        else console.log("not a valid action - can't sell more then you hold");
                    }
                    else console.log("not a valid action - can't sell what you don't have");
                    break;
                case "Short":
                    var book_value = parseFloat(row_data.volume)*parseFloat(row_data.book_price);
                    var last_value = parseFloat(row_data.volume)*parseFloat(row_data.last_price);
                    var hash_value = row_data.asset+'_S';
                    total_cash =  total_cash - book_value;
                    if (net_data[hash_value]==undefined)
                    {
                        net_data[hash_value]= [row_data.volume, book_value, last_value, row_data.sector];
                    }
                    else
                    {
                        net_data[hash_value][0] = parseInt(net_data[hash_value][0]) + parseInt(row_data.volume);
                        net_data[hash_value][1] = parseFloat(net_data[hash_value][1] + book_value);
                        net_data[hash_value][2] = parseFloat(net_data[hash_value][2] + last_value);
                    }
                    break;
                case "Cover":
                    var hash_value = row_data.asset+'_S';
                    if (net_data[hash_value] != undefined)
                    {
                        var last_price = parseFloat(net_data[hash_value][2]/net_data[hash_value][0]);
                        var book_price = parseFloat(net_data[hash_value][1]/net_data[hash_value][0]);
                        var volum_diff = parseInt(net_data[hash_value][0]) - parseInt(row_data.volume);
                        var book_value = row_data.volume*book_price;
                        if (volum_diff>=0)
                        {
                            net_data[hash_value][0] = volum_diff;
                            net_data[hash_value][1] = parseFloat(net_data[hash_value][0] * book_price);
                            total_cash = total_cash + book_value - row_data.volume*(row_data.book_price - book_price);
                            net_data[hash_value][2] = parseFloat(net_data[hash_value][0] * last_price);
                        }
                        else console.log("Can't cover more than you have in a short position" );
                    }
                    else console.log("No short position found to cover");
                    break;
            }
        }
        //namespace_gui.send_log_message("start cash is "+  start_cash, "Info");
        return { "net_positions" : net_data, "total_cash": math_util.aux_math_round(total_cash,2), "start_cash" : start_cash };
      }
  }
}) ();

var namespace_iplanner = (function(){
  var p_data = {};
  var p_data_extended = {};
  var API_URL = "/data_api";

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
    //append charts here
    if (score<16)
    {
      p_data["basic"] = [['Cash',0.00],['Equity',0.00],['Fixed Income', 100.00]];
      p_data["plus"] = [['Cash',0.00],['Equity',0.00],['Fixed Income', 100.00]];
    }
    else if (score<24)
    {
      p_data["basic"] = [['Cash',0.00],['Equity',15.00],['Fixed Income', 85.00]];
      p_data["plus"] = [['Cash',0.00],['Equity',15.00],['Fixed Income', 85.00]];
    }
    else if ((score>=24)&&(score<=30))
    {
      p_data["basic"] = [['Cash',0.00],['Equity',60.00],['Fixed Income', 40.00]];
      p_data["plus"] = [['Cash',0.00],['Equity',60.00],['Fixed Income', 40.00]];
    }
    else if (score>30)
    {
      p_data["basic"] = [['Cash',0.00],['Equity',80.00],['Fixed Income', 20.00]];
      p_data["plus"] = [['Cash',0.00],['Equity',80.00],['Fixed Income', 20.00]];
    }
    return p_data;
  }

  function create_detailed_series(p_score)
  {
    //append charts here
    if (p_score<16)
    {
      p_data_extended["basic"] = [
        ['AGG', 40.0],
        ['XBB.TO',30.0],
        ['IEI', 10.0],
        ['TLT', 10.0],
        ['SHY', 5.0],
        ['HYG', 5.0]
      ];
      p_data_extended["plus"] = [
        ['AGG', 35.0],
        ['XBB.TO',30.0],
        ['HYG', 15.0],
        ['TLT', 10.0],
        ['SHY', 5.0],
        ['PFF', 5.0]
      ];
    }
    else if (p_score<24)
    {
      p_data_extended["basic"] = [
        ['AGG', 40.0],
        ['XBB.TO',20.0],
        ['PFF', 10.0],
        ['HYG', 10.0],
        ['VEE', 10.0],
        ['DVY', 5.0],
        ['VSC.TO', 5.0]
      ];
      p_data_extended["plus"] = [
        ['AGG', 40.0],
        ['XBB.TO',20.0],
        ['PFF', 15.0],
        ['VEE', 15.0],
        ['HYG', 10.0]
      ];
    }
    else if ((p_score>=24)&&(p_score<=30))
    {
      p_data_extended["basic"] = [
        ['VOO', 20.0],
        ['IVE', 10.0],
        ['IWV', 10.0],
        ['AGG', 20.0],
        ['HYG', 5.0],
        ['XIC.TO', 20.0],
        ['XBB.TO', 10.0],
        ['VEE', 5.0]
      ];
      p_data_extended["plus"] = [
        ['VOO', 20.0],
        ['IVW', 5.0],
        ['IVE', 5.0],
        ['IWV', 10.0],
        ['AGG', 15.0],
        ['HYG', 10.0],
        ['XIC.TO', 20.0],
        ['XBB.TO', 10.0],
        ['VEE', 5.0]
      ];
    }
    else if (p_score>30)
    {
      p_data_extended["basic"] = [
        ['VOO', 20.0],
        ['IJR', 5.0],
        ['IVE', 10.0],
        ['IWV', 15.0],
        ['AGG', 10.0],
        ['HYG', 5.0],
        ['XIU.TO', 15.0],
        ['XCG.TO', 10.0],
        ['XBB.TO', 5.0],
        ['VEE', 5.0]
      ];
      p_data_extended["plus"] = [
        ['VOO', 20.0],
        ['IJR', 5.0],
        ['IVE', 5.0],
        ['IWV', 15.0],
        ['AGG', 10.0],
        ['XIU.TO', 15.0],
        ['XCG.TO', 10.0],
        ['XBB.TO', 5.0],
        ['EFG',10.0],
        ['VEE', 5.0]
      ];
    }
    return p_data_extended;
  }

  function compute_chart_series(p_data)
  {
    var p_data_ex = {"basic":[], "plus":[]}
    for (var i=0;i<p_data["basic"].length;i++)
    {
      if (p_data["basic"][i][1] > 0.0)
        p_data_ex["basic"].push(p_data["basic"][i]);
      if (p_data["plus"][i][1] > 0.0)
        p_data_ex["plus"].push(p_data["plus"][i]);
    }
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

  function cell_macro(p_value)
  {
    var cell = "<td>" + p_value + "</td>";
    return cell;
  }

  function row_macro(p_values)
  {
    var row = "";
    for (var i=0;i<p_values.length;i++)
    {
      row = row + cell_macro(p_values[i]);
    }
    row = "<tr>" + row + "</tr>";
    return row;
  }

  function append_tables_advanced(p_data)
  {
    var rows="";
    var rows_2="";
    for (var i=0;i<p_data["basic"].length;i++)
    {
      var symbol_data  = namespace_marketdata.get_data(p_data["basic"][i][0]);
      rows = rows + row_macro([
        symbol_data["ticker"],
        symbol_data["currency"],
        symbol_data["type"],
        symbol_data["desc"],
        p_data["basic"][i][1] +'%'
      ]);
    }
    $("#table_3 tbody").empty();
    $("#table_3 tbody").append(rows);
    $("#table_3").show();
    // add second one
    for (var i=0;i<p_data["plus"].length;i++)
    {
      var symbol_data  = namespace_marketdata.get_data(p_data["plus"][i][0]);
      rows_2 = rows_2 + row_macro([
        symbol_data["ticker"],
        symbol_data["currency"],
        symbol_data["type"],
        symbol_data["desc"],
        p_data["plus"][i][1] +'%'
      ]);
    }
    $("#table_4 tbody").empty();
    $("#table_4 tbody").append(rows_2);
    $("#table_4").show();
  }

  //create transactions
  //create position data from transactions
  //compute net_dat from position data
  //request portfolio series from net data and transactions
  //plot chart

  function render_portfolios()
  {
    var transaction_list = [];
    var net_cash = 100000;
    var portfolio_value_list = [];
    var start_date = "2014-08-01";
    if ($("input[name=portfolio_selected]:checked").val()=="basic")
    {
      //start with 100k cash
      $.each(p_data_extended["basic"], function(index, value){
        portfolio_value_list.push([value[0],value[1]/100 * net_cash]);
      });
      var counter = portfolio_value_list.length;
      var net_cash_value = 0;
      $.each(portfolio_value_list, function(index, value){
        $.getJSON(API_URL, {instrument:value[0], call:"quote", datetime:start_date}, function(data)
        {
          if (data.header.error_code == 0)
          {
            var book_price = data.contents.price;
            var book_volume = math_util.aux_math_round(value[1]/data.contents.price,0);
            var last_date = datetime_util.adjust_date(datetime_util.get_yesterday_date());
            $.getJSON(API_URL, {instrument:value[0], call:"quote", datetime:last_date}, function(data)
            {
              if (data.header.error_code == 0)
              {
                var last_price = data.contents.price;
                $.getJSON(API_URL, {instrument:value[0], call:"sector"}, function(data)
                {
                  if (data.header.error_code == 0)
                  {
                    //here be transaction
                    var sector_value = data.contents.sector_data;
                    var new_transaction = {
                      volume:book_volume,
                      book_date: start_date,
                      type: "Buy",
                      asset: value[0],
                      sector: sector_value,
                      book_price: book_price,
                      last_price: last_price,
                    };
                    net_cash_value = net_cash_value + new_transaction.volume*new_transaction.book_price;
                    transaction_list.push(new_transaction);
                    counter--;
                    if (counter<=0)
                    {
                      var cash_transaction = {
                        volume: net_cash_value,
                        book_date: start_date,
                        type: "Deposit",
                        asset: "Cash",
                        sector: "-",
                        book_price: 1.0,
                        last_price: 1.0
                      };
                      transaction_list.push(cash_transaction);
                      console.log(transaction_list);
                      var position_data = namespace_portfolio_aux.compute_position_data(transaction_list);
                      console.log(position_data);
                    }
                  }
                });
              }
            });
          }
        });
      })
    }
    else if ($("input[name=portfolio_selected]:checked").val()=="advanced")
    {
      console.log(p_data_extended["plus"]);
      console.log("Advanced selected");
    }
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
    },

    show_performance_view: function()
    {
      render_portfolios();
      $('a[href=#Tab3]').tab('show');
      //build virtual portfolios
      //request data
      //plot charts
      //console.log(p_data_extended);
    }
  }
}) ();
