var OIOevents =[]
var activities_
var dict
var small_chart_height =200
var fake = {}
var today = new Date()
//timeline controllers

leftOffset = 210
rightOffset = 65
verticalIncrement = 25
verticalOffset = 30
topOffset = 70
bottomOffset = 30
collision_distance = 15

msperday = 1000*60*60*24

var dateFormat = d3.time.format('%d/%m/%Y')
var currencyFormat = d3.format("$.2f")

var parseDate = _.memoize(dateFormat.parse)


function cleanup(d) {
  d.date = parseDate(d["Posting Date"]);
  d.Amount = +d.Amount
  return d
}

  function timeline(events){
    
    headHeight = topOffset+3+10
    
    height = events.length*verticalIncrement+verticalOffset+bottomOffset
    events = _.sortBy(events,function(d){return d.date.getTime()})
    
    timelineHead = d3.select("#timeline").append('svg').attr({
      height: headHeight, 
      width: '100%',
      id:'timeline-head' 
    })

    
    timelineBody = d3.select("#timeline").append('div').append('svg').attr({
      height: height, 
      width: '100%',
      id:'timeline-body'
    })
    
    timeDomain = d3.extent(events,function(d){return d.date})
    
    // wait for layout
    
    setTimeout(function(){
      
      width = timelineHead.node().getBoundingClientRect().width
      timelineHead.append("line").attr({x1:leftOffset,
                                    x2:width-rightOffset,
                                    y1:topOffset,
                                    y2:topOffset,
                                    stroke:'#a5a5a5',
                                    'stroke-width':6
                                    })
      timeRange = [0, width - (leftOffset+rightOffset)]
      timeScale = d3.time.scale().domain(timeDomain).range(timeRange)

      last_printed_t = 0
      for (i in events){
        
        date = dateFormat(events[i].date)       
        collision = +i && timeScale(events[i].date)-last_printed_t < collision_distance 
        
        if (! collision){
          last_printed_t = timeScale(events[i].date)
          events[i].printdate = date
          }  
        else {
          events[i].printdate = ''  
          }
        }
          
      headPoints = timelineHead.selectAll("g").data(events)
      bodyPoints = timelineBody.selectAll("g").data(events)
      
      headPoints.enter().append("g")
      bodyPoints.enter().append("g")
      
      bodyPoints.append('polyline').attr({
        points: function(d,i){
          t=timeScale(d.date)+leftOffset
          v = (i+1)*verticalIncrement +verticalOffset
        
          return '0,0 0,'+v+' '+t*-1+','+v
          },
        fill:  'none',
        stroke:'grey',
        transform: function(d){t=timeScale(d.date)+leftOffset; return 'translate('+t+',0)'}
      })
      
      bodyPoints.append('text').text(function(d){return currencyFormat(d.Amount)+', '+d.Nature+', '+d.Location})
        .attr({
          transform: function(d,i){
            v=((i+0.9)*verticalIncrement)+(verticalOffset)
            return 'translate(0,'+v+')'
            },
          title: function(d){return dateFormat(d.date)}
          })
      
      headPoints.append('text').text(function(d){return d.printdate})
        .attr({
          transform: function(d){
            t=timeScale(d.date)+leftOffset
            v= topOffset
            return 'rotate(-45 '+t+' '+v+') translate('+(t+7)+','+v+')'
            },
          'font-size':'12px',
          fill:'#727272'
          })
      
      headPoints.append('circle').attr({
        r: '5px',
        //fill:  '#E6550D'
        fill:'red',
        transform: function(d){
          t=timeScale(d.date)+leftOffset; 
          return 'translate('+t+','+topOffset+')'
          }
        })
      
      headPoints.selectAll('circle').append('title').text(function(d){return currencyFormat(d.Amount)+'\n'+d.Purpose+'\n'+d.Nature+', '+d.Location+': '+dateFormat(d.date)})
      
      d3.selectAll('text').append('title').text(function(d){return currencyFormat(d.Amount)+'\n'+d.Purpose+': '+dateFormat(d.date)})
      
      headPoints.exit().remove()
      bodyPoints.exit().remove()
      
      },0)
      
  }

//-------------do the things.

queue()
    .defer(d3.csv, "data/MNZ-CE-Expenses-July-2014-June-2015.csv")
    .await(showCharts);

function showCharts(err, _expense) {

  expenses = _.map(_expense,cleanup)
  timeline(expenses)
  
  // add some formatting, just for fun
  setTimeout(function(){ 
    extent = d3.extent(expenses, function(d){return d.Amount})
    colorScale = d3.scale.linear().interpolate(d3.interpolateLab).domain([0,100,extent[1]]).range(['blue','yellow','red'])
    d3.selectAll('circle').attr({
      'fill':function(d){return colorScale(d.Amount)},
      'r':function(d){return Math.pow(d.Amount,.3)}
    })
    
  },0)
}
