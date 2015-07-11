$(document).ready(function(){
  $("#get_score").on('click', function(e){
      var net_value = 0;
      net_value =  parseInt($("#age").val())
        + parseInt($("#net_assets").val())
        + parseInt($("#knowledge").val())
        + parseInt($("#duration").val())
        + parseInt($("#goal").val())
        + parseInt($("#max_drop").val())
        + parseInt($("#recover").val())
        + parseInt($("#profit_or_loss").val());
      namespace_basic.display_score(net_value);
    });
  $("#show_performance").on('click', function(e){
    $('a[href=#Tab3]').tab('show');
  });
  namespace_graphs.init_chart_style();
  $("#show_performance").hide();
  $("#table_1").hide();
  $("#table_2").hide();
  $("#table_3").hide();
  $("#table_4").hide();
});

var namespace_basic = (function() {

  //convert that to better code
  function map_to_html(p_obj)
  {
    var template='<table class="table table-bordered">'+
    '<tr><th>Score</th><th>Your&nbsp;Investment&nbsp;Profile</th><th>Notes</th><th>Actions</th></tr>'+
    '<tr><td id="p_score">'
      + p_obj["score"] + '</td><td>' + p_obj["title"] + '</td><td>'
      + p_obj["Description"]
      + '</td><td><button class="btn btn-default" onclick="namespace_basic.show_portfolios()">Show Investment Plans</button></td></tr></table>';
    $("#investor_type").empty();
    $("#investor_type").append(template);
  }

  function append_simple_charts(p_data)
  {
    var chart_objs = [{
      title : { text : 'Basic'},
      plotOptions: {
        column : {
          color:'green',
          negativeColor:'red',
        }
      },
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
      plotOptions: {
        column : {
          color:'green',
          negativeColor:'red',
        }
      },
      legend : {enabled:false},
      series: [{
            type: 'pie',
            name: 'Portfolio share',
            innerSize: '50%',
            data: p_data["plus"]
          }]
    }];
    $("#chart_container_1").highcharts('Chart', chart_objs[0]);
//    $("#chart_container_12").highcharts('Chart', chart_objs[0]);
    $("#chart_container_2").highcharts('Chart', chart_objs[1]);
//    $("#chart_container_22").highcharts('Chart', chart_objs[1]);
  }

  function append_basic_tables(p_data)
  {
      $("#table_1").empty();
      $("#table_1").append('<tr><td>Cash</td><td>'+p_data["basic"][0][1]+'%</td></tr>');
      $("#table_1").append('<tr><td>Equity</td><td>'+p_data["basic"][1][1]+'%</td></tr>');
      $("#table_1").append('<tr><td>Fixed Income</td><td>'+p_data["basic"][2][1]+'%</td></tr>');
      $("#table_2").empty();
      $("#table_2").append('<tr><td>Cash</td><td>'+p_data["plus"][0][1]+'%</td></tr>');
      $("#table_2").append('<tr><td>Equity</td><td>'+p_data["plus"][1][1]+'%</td></tr>');
      $("#table_2").append('<tr><td>Fixed Income</td><td>'+p_data["plus"][2][1]+'%</td></tr>');
  }

  function get_basic_distribution(p_score)
  {

  }

  function get_advanced_distribution(p_score)
  {

  }
  
  return {
    show_portfolios: function()
    {
      var error_obj = {
        name: 'Proprietary or Undetectable',
        y: 0.2,
        dataLabels: { enabled: false }
      };
      var score = $("#p_score").text();
      var p_data = {};
      //append charts here
      if (score<16)
      {
        p_data["basic"] = [['Cash',10.00],['Fixed Income', 90.00],error_obj];
        p_data["plus"] = [['Cash',5.00],['Fixed Income', 95.00],error_obj];
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
      append_simple_charts(p_data);
      append_basic_tables(p_data);
      $('a[href=#Tab2]').tab('show');
      $("#show_performance").show();
      $("#table_1").show();
      $("#table_2").show();
    },
    //Compute portfolio performance
    display_score: function(p_rank_value)
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
      map_to_html(investor_profile);
    }
  }
}) ();
