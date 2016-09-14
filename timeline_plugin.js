function timeline(config){
  config = config || {};
  var msperdar = msperday = 1000*60*60*24;
  
  var defaults = {
    leftOffset:210,
    rightOffset:65,
    verticalIncrement:25,
    verticalOffset:30,
    topOffset:70,
    bottomOffset:30,
    collisionDistance:15,
    timeFormat : '%d/%m/%Y',
    currencyFormat : "$.2f",
    lineWidth: 6,
    lineColor:'#a5a5a5',
    dateAccessor: function(d){return d.date},
    labelAccessor: function(d){return d.label},
    keyAccessor: function(d){return d.date + d.label},
    sorting:true
  }
  
  for (var attrname in defaults) {
    config[attrname] = (config[attrname] === undefined)?defaults[attrname]:config[attrname]; 
  }
  
  
  function render(selection){
    var height = selection.node().getBoundingClientRect().height;
    var width = selection.node().getBoundingClientRect().width;
    
    var headHeight = config.topOffset+(config.lineWidth/2)+10 //10 is the overlap of the svgs
    var bodyHeight = selection.datum().length*config.verticalIncrement+config.verticalOffset+config.bottomOffset
    
    
    // get the data off of the selection
    var data = selection.datum();
    
    if (config.sorting) {
      data = data.sort(function(a,b){
        return config.dateAccessor(a) - config.dateAccessor(b)
      })
    }
    
    selection.selectAll('svg.headSVG')
      .data([1])
      .enter()
        .append('svg')
        .attr('height', headHeight) 
        .attr('width', '100%')
        .classed('headSVG',true)
    
    selection.selectAll('div')
      .data([1])
      .enter()
        .append('div')
        .append('svg')
        .attr('height', bodyHeight) 
        .attr('width', '100%')
        .classed('bodySVG',true)
        
    var head = selection.select('svg.headSVG').datum(data);
    var body = selection.select('div svg.bodySVG').datum(data);

    // render head
    
    //this is the line behind the timeline
    var timeDomain = d3.extent(data, config.dateAccessor)
    if (head.selectAll('line').empty()){
      head.append("line")
    }
    
    head.select('line')
        .attr('x1',config.leftOffset)
        .attr('x2',width-config.rightOffset)
        .attr('y1',config.topOffset)
        .attr('y2',config.topOffset)
        .attr('stroke',config.lineColor)
        .attr('stroke-width',config.lineWidth)
    
    // timeScale tells us how far along the line we plot our points.
    
    var timeRange = [0, width - (config.leftOffset+config.rightOffset)]
    var timeScale = d3.scaleTime().domain(timeDomain).range(timeRange)
    var timeFormat = d3.timeFormat(config.timeFormat)
    
    var headPoints = head.selectAll("g").data(data,config.keyAccessor);
    var headPointsEnter = headPoints.enter().append("g");
    headPointsEnter.append('circle')
      .classed('timeline-marker',true)
      .attr('r', '5px')
      .attr('fill','red')
      .attr('transform', function(d){
        t=timeScale(d.date)+config.leftOffset; 
        return 'translate('+t+','+config.topOffset+')'
      })
    

    headPointsEnter.append('text')
      .classed('timeline-marker-text',true)
      .attr('font-size','12px')
      .attr('fill','#727272')
      .attr('transform', function(d){
          t = timeScale(config.dateAccessor(d))+config.leftOffset
          console.log(d.date,t)
          v = config.topOffset
          return 'rotate(-45 '+t+' '+v+') translate('+(t+7)+','+v+')'
        })
    
    headPoints.exit().remove();
    
    headPoints = headPoints.merge(headPointsEnter);

    // collision detection for labels
    var last_printed_t = 0;
    
    headPoints.each(function(d,i){
      var date = config.dateAccessor(d)       
      d.collision = i && timeScale(date)-last_printed_t < config.collisionDistance
      if (!d.collision) {
        last_printed_t = timeScale(date)
      }
    })
    
    headPoints.selectAll('text').transition()
      .text(function(d){return d.collision?'':timeFormat(config.dateAccessor(d))})
      .attr('transform', function(d){
          t = timeScale(config.dateAccessor(d))+config.leftOffset
          console.log(d.date,t)
          v = config.topOffset
          return 'rotate(-45 '+t+' '+v+') translate('+(t+7)+','+v+')'
        })

    headPoints.selectAll('circle').transition()
      .attr('transform', function(d){
        t=timeScale(d.date)+config.leftOffset; 
        return 'translate('+t+','+config.topOffset+')'
      })


    bodyPoints = body.selectAll("g").data(data,config.keyAccessor)
    var bodyPointsEnter = bodyPoints.enter().append("g");
    
    bodyPointsEnter.append('polyline')
      .classed('label-line', true)
      .attr('fill', 'none')
      .attr('stroke', 'grey')
      .attr('points', function(d,i){
        t=timeScale(d.date)+config.leftOffset
        v = (i+1)*config.verticalIncrement +config.verticalOffset
        return '0,0 0,'+v+' '+t*-1+','+v
      })
      .attr('transform', function(d){
        t=timeScale(config.dateAccessor(d))+config.leftOffset; 
        return 'translate('+t+',0)'
      })

    bodyPointsEnter.append('text')
      .classed('label-text', true)
      .attr('transform', function(d,i){
        v=((i+0.9)*config.verticalIncrement)+(config.verticalOffset)
        return 'translate(0,'+v+')'
      })
    
    bodyPoints.exit().remove();

    bodyPoints = bodyPoints.merge(bodyPointsEnter)
    body.selectAll('polyline').transition()
      .attr('points', function(d,i){
        t=timeScale(d.date)+config.leftOffset
        v = (i+1)*config.verticalIncrement +config.verticalOffset
        return '0,0 0,'+v+' '+t*-1+','+v
      })
      .attr('transform', function(d){
        t=timeScale(config.dateAccessor(d))+config.leftOffset; 
        return 'translate('+t+',0)'
      })
    
    body.selectAll('text.label-text')
      .text(config.labelAccessor)
      .transition()
      .attr('transform', function(d,i){
        v=((i+0.9)*config.verticalIncrement)+(config.verticalOffset)
        return 'translate(0,'+v+')'
      })
    
  }
  
  render.leftOffset = function(value) {
    if (!arguments.length) return config.leftOffset;
    config.leftOffset = value;
    return render;
  }

  render.rightOffset = function(value) {
    if (!arguments.length) return config.rightOffset;
    config.rightOffset = value;
    return render;
  }

  render.verticalIncrement = function(value) {
    if (!arguments.length) return config.verticalIncrement;
    config.verticalIncrement = value;
    return render;
  }

  render.verticalOffset = function(value) {
    if (!arguments.length) return config.verticalOffset;
    config.verticalOffset = value;
    return render;
  }

  render.topOffset = function(value) {
    if (!arguments.length) return config.topOffset;
    config.topOffset = value;
    return render;
  }

  render.bottomOffset = function(value) {
    if (!arguments.length) return config.bottomOffset;
    config.bottomOffset = value;
    return render;
  }

  render.collisionDistance = function(value) {
    if (!arguments.length) return config.collisionDistance;
    config.collisionDistance = value;
    return render;
  }

  render.timeFormat = function(value) {
    if (!arguments.length) return config.timeFormat;
    config.timeFormat = value;
    return render;
  }

  render.currencyFormat = function(value) {
    if (!arguments.length) return config.currencyFormat;
    config.currencyFormat = value;
    return render;
  }

  render.lineWidth = function(value) {
    if (!arguments.length) return config.lineWidth;
    config.lineWidth = value;
    return render;
  }

  render.lineColor = function(value) {
    if (!arguments.length) return config.lineColor;
    config.lineColor = value;
    return render;
  }

  render.dateAccessor = function(value) {
    if (!arguments.length) return config.dateAccessor;
    config.dateAccessor = value;
    return render;
  }

  render.labelAccessor = function(value) {
    if (!arguments.length) return config.labelAccessor;
    config.labelAccessor = value;
    return render;
  }

  render.keyAccessor = function(value) {
    if (!arguments.length) return config.keyAccessor;
    config.keyAccessor = value;
    return render;
  }

  render.sorting = function(value) {
    if (!arguments.length) return config.sorting;
    config.sorting = value;
    return render;
  }

  return render
}

//tl = timeline({dateFormat:'%d/%m/%Y'})
//
//d3.select('#timeline').data(data).call(tl)