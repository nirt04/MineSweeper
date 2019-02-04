'use strict'

function randNumInc(max,min){
    return Math.floor(Math.random() * (max+1-min)) + min
}

function randNum(max,min){
    return Math.floor(Math.random() * (max-min)) + min
}