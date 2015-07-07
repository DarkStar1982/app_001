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
});

var namespace_basic = (function(e) {
  return {
    //Compute portfolio performance
    display_score: function(p_rank_value)
    {
      //8-15
      if (p_rank_value<16)
      {
        //security
      }
      else if (p_rank_value<24)
        //income
      }
      else if (p_rank_value>24)
        //growth
      }
      else if (p_rank_value>30)
        //income
      }
      console.log(p_rank_value);
    //  switch (p_rank_value)

    }
  }
}) ();
