/*

 */

define([
    'jquery',
    'd3',
    'kb_vis_visWidget'
],
    function ($, d3) {

    'use strict';
    $.KBWidget({
	    name: "kbaseLinechart",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            overColor : 'yellow',
            useOverLine : true,
            useLineLabelToolTip : true,

            lineWidth : 3,
            lineCap : 'round',
            strokeColor : 'black',
            fillColor : 'none',
            strokeOpacity : 1.0,
            fillOpacity : 0.3,
            xIncrementor : function(xIdx) {
                return xIdx != undefined ? xIdx + 1 : 0;
            },

            useHighlightLine : true,
            highlightLineColor : 'red',
            highlightLineWidth : 1,
            shapeArea : 64,

            xInset : 0.1,
            yInset : 0.1,

        },

        _accessors : [

        ],

        extractLegend : function (dataset) {

            var legend = [];
            dataset.forEach(
                function(line, idx) {
                    legend.push(
                        {
                            color : line.strokeColor,
                            label : line.label,
                            shape : line.shape
                        }
                    )
                }
            )

            this.setLegend(legend);

        },

        setDataset : function(dataset) {

            var $line = this;

            dataset.forEach(
                function(line, idx) {
                    if (line.values) {

                        var revLine = [];

                        var numPoints = line.values.length;

                        var xInc = $line.options.xIncrementor;

                        var xIdx = xInc();

                        for (var i = 0; i < numPoints; i++) {
                            var point = line.values[i];

                            if (! $.isPlainObject(point)) {
                                line.values[i] = {x : xIdx, y : point}
                                xIdx = xInc(xIdx);
                            }
                            else {
                                if (point.x) {
                                    xIdx = xInc(point.x);
                                }
                                else {
                                    point.x = xIdx;
                                }
                                if (point.y2) {
                                    revLine.push( { x : point.x, y : point.y2} )
                                    delete point.y2;
                                }
                            }
                        }

                        if (revLine.length) {
                            for (var i = revLine.length - 1; i >= 0 ; i--) {
                                line.values.push(revLine[i]);
                            }
                            line.values.push(line.values[0]);
                        }

                    }
                }
            );

            this._super(dataset);
        },

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }


            var ret = [
                d3.min(
                    this.dataset(),
                    function (l) {
                        return d3.min(l.values.map(function(d) { return d.x }))
                    }
                ),
                d3.max(
                    this.dataset(),
                    function (l) {
                        return d3.max(l.values.map(function(d) { return d.x }))
                    }
                )
            ];

            var delta = Math.max(this.options.xInset * ret[0], this.options.xInset * ret[1]);
            ret[0] -= delta;
            ret[1] += delta;

            return ret;

        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            var ret = [
                d3.min(
                    this.dataset(),
                    function (l) {
                        return d3.min(l.values.map(function(d) { return d.y }))
                    }
                ),
                d3.max(
                    this.dataset(),
                    function (l) {
                        return d3.max(l.values.map(function(d) { return d.y }))
                    }
                )
            ];

            var delta = Math.max(this.options.yInset * ret[0], this.options.yInset * ret[1]);
            ret[0] -= delta;
            ret[1] += delta;

            return ret;
        },

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $line  = this;

            var lineMaker = d3.svg.line()
                .x(function(d) { return $line.xScale()(d.x) })
                .y(function(d) { return $line.yScale()(d.y) });

            var funkyTown = function() {

                this
                    .attr('d',              function(d) {return lineMaker(d.values) })
                    .attr('stroke',         function (d) { return d.strokeColor || $line.options.strokeColor } )
                    .attr('fill',           function(d) { return d.fillColor || $line.options.fillColor} )
                    .attr('fill-opacity',        function (d) { return d.fillOpacity || $line.options.fillOpacity} )
                    .attr('stroke-opacity',        function (d) { return d.strokeOpacity || $line.options.strokeOpacity} )
                    .attr('stroke-width',   function (d) {return d.width != undefined ? d.width : $line.options.lineWidth} )
                    .attr('stroke-linecap',   function (d) {return d.linecap || $line.options.lineCap} )
                    .attr('stroke-dasharray',   function (d) {return d.dasharray } )
                ;

                return this;

            };

            var mouseAction = function() {

                if (! $line.options.useOverLine) {
                    return;
                }

                this.on('mouseover', function(d) {
                    if ($line.options.overColor) {
                        d3.select(this)
                            .attr('stroke', $line.options.overColor)
                            .attr('stroke-width', (d.width || $line.options.lineWidth) + 5);
                    }

                    if (d.label && $line.options.useLineLabelToolTip) {
                        $line.showToolTip(
                            {
                                label : d.label,
                            }
                        );
                    }

                })
                .on('mouseout', function(d) {
                    if ($line.options.overColor) {
                        d3.select(this)
                            .attr('stroke',         function (d) { return d.strokeColor || $line.options.strokeColor } )
                            .attr('stroke-width',   function (d) {return d.width != undefined ? d.width : $line.options.lineWidth} );

                        if ($line.options.useLineLabelToolTip) {
                            $line.hideToolTip();
                        }

                    }
                })
                return this;
            };

            if (this.options.hGrid && this.yScale) {
                var yAxis =
                    d3.svg.axis()
                    .scale(this.yScale())
                    .orient('left')
                    .tickSize(0 - bounds.size.width)
                    .outerTickSize(0)
                    .tickFormat('');

                var gyAxis = this.D3svg().select(this.region('chart')).select('.yAxis');

                if (gyAxis[0][0] == undefined) {
                    gyAxis = this.D3svg().select(this.region('chart'))
                        .append('g')
                        .attr('class', 'yAxis axis')
                        .attr("transform", "translate(" + 0 + ",0)")
                }

                gyAxis.transition().call(yAxis);
                gyAxis.selectAll('line').style('stroke', 'lightgray');
            }

            var chart = this.data('D3svg').select(this.region('chart')).selectAll('.line').data(this.dataset(), function (d) {return d.label});

            chart
                .enter()
                    .append('path')
                        .attr('class', 'line')
                        .call(funkyTown)
                        .call(mouseAction)
                ;

                chart
                    .call(mouseAction)
                    .transition()
                    .duration(this.options.transitionTime)
                    .call(funkyTown)
                ;

                chart
                    .exit()
                        .remove();

            var time = $line.linesDrawn ? $line.options.transitionTime : 0;

            var pointsData = [];
            this.dataset().forEach(function(line, i) {

                line.values.forEach(function (point, i) {

                    if (line.shape || point.shape) {
                        var newPoint = {};
                        for (var key in point) {
                            newPoint[key] = point[key];
                        };

                        newPoint.color = point.color || line.fillColor || line.strokeColor || $line.options.fillColor;
                        newPoint.shape = point.shape || line.shape;
                        newPoint.shapeArea = point.shapeArea || line.shapeArea || $line.options.shapeArea,
                        newPoint.pointOver = point.pointOver || line.pointOver || $line.options.pointOver,
                        newPoint.pointOut = point.pointOut || line.pointOut || $line.options.pointOut,
                        newPoint.id = [point.x, point.y, line.label].join('/'),

                        pointsData.push(newPoint);
                    }
                })
            })

            var points = $line.data('D3svg').select($line.region('chart')).selectAll('.point').data(pointsData, function (d) { return d.id});

            points.enter()
                .append('path')
                    .attr('class', 'point')
                    .attr('opacity', 0)
                    .attr("transform", function(d) { return "translate(" + $line.xScale()(d.x) + "," + $line.yScale()(d.y) + ")"; })
                    .on('mouseover', function(d) {

                        if ($line.options.overColor) {
                            d3.select(this)
                                .attr('fill', $line.options.overColor)
                        }

                        if (d.label) {
                            $line.showToolTip(
                                {
                                    label : d.label,
                                }
                            );
                        }
                        else if (d.pointOver) {
                            d.pointOver.call($line, d);
                        }
                    })
                    .on('mouseout', function(d) {
                        if ($line.options.overColor) {
                            d3.select(this)
                                .attr('fill', function(d) {return d.color})
                        }

                        if (d.label) {
                            $line.hideToolTip();
                        }
                        else if (d.pointOut) {
                            d.pointOut.call($line, d);
                        }
                    })

            points
                .transition().duration(time)
                .attr("transform", function(d) { return "translate(" + $line.xScale()(d.x) + "," + $line.yScale()(d.y) + ")"; })
                .attr('d', function (d) {return d3.svg.symbol().type(d.shape).size(d.shapeArea)() } )
                .attr('fill', function(d) {return d.color})
                .attr('opacity', 1)
            ;

            points.exit()
                .transition().duration(time)
                .attr('opacity', 0)
                .remove();

            if (this.options.useHighlightLine) {
                var highlight = this.data('D3svg').select(this.region('chart')).selectAll('.highlight').data([0]);

                highlight.enter()
                    .append('line')
                    .attr('x1', bounds.size.width / 2)
                    .attr('x2', bounds.size.width / 2)
                    .attr('y1', 0)
                    .attr('y2', bounds.size.height)
                    .attr('opacity', 0)
                    .attr('stroke', this.options.highlightLineColor)
                    .attr('stroke-width', this.options.highlightLineWidth)
                    .attr('pointer-events', 'none')
                ;

                this.data('D3svg').select(this.region('chart'))
                    .on('mouseover', function(d) {
                        highlight.attr('opacity', 1);
                    })
                    .on('mousemove', function(d) {
                        var coords = d3.mouse(this);
                        highlight
                            .attr('x1', coords[0])
                            .attr('x2', coords[0])
                            .attr('opacity', 1)
                    })
                    .on('mouseout', function(d) {
                        highlight.attr('opacity', 0);
                    })
                ;
            }

            this.linesDrawn = true;

        },

        setYScaleRange : function(range, yScale) {
            return this._super(range.reverse(), yScale);
        },


})    });
