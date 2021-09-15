// ==UserScript==
// @name     Redfin Tools
// @description Useful tools for checking out Redfin listings
// @match 	 https://www.redfin.com/**/home/*
// @version  1
// @grant    none
// ==/UserScript==

function makeToolbox() {
  return `
		<style>
			#rtb-container * {
				box-sizing: border-box;
				-moz-box-sizing: border-box;
				-webkit-box-sizing: border-box;
				margin: 0;
				padding: 0;
			}

			#rtb-container {
				width: 140px;
				border: solid 1px #333333;
				padding-left: 0.5em;
				padding-right: 0.5em;
				position: fixed;
				right: 1px;
				top: 20%;
				background-color: rgba(10, 10, 10, 0.5);
				z-index: 1000;
			}

			#rtb-container li {
				list-style: none;
				margin-top: 0.5em;
				margin-bottom: 0.5em;
			}

			#rtb-container button {
				width: 100%;
				padding-top: 0.25em;
				padding-bottom: 0.25em;
			}
		</style>
    <div id='rtb-container'>
			<div id="rtb-actions">
				<ul>
					<li><button id="rtb-copy-short-row">Copy Short Row</button></li>
					<li><button id="rtb-copy-long-row">Copy Long Row</button></li>
					<li><button id="rtb-copy-scoring-details">Get Scoring Details</button></li>
					<li><button id="rtb-log-all-details">Log All Details</button></li>
				</ul>
			</div>
    </div>
`
}


function getStreetAddress() {
  return document.getElementsByClassName('street-address')[0]?.title
}

function getCityStateZip() {
  return document.getElementsByClassName('dp-subtext')[0]?.innerText
}

function parseMainStats() {
  const statsHtml = document.getElementsByClassName('home-main-stats-variant')[0]
  let stats = {}
  for (const statHtml of statsHtml.children) {
    const [value, key] = statHtml.innerText.split(/\n/)
    stats[key] = value
  }
  return stats
}

function parseKeyDetailsList() {
  const lists = document.getElementsByClassName('keyDetailsList')
  let details = {}
  for (const list of lists) {
    for (const detailHtml of list.children) {
      const [key, value] = detailHtml.innerText.split(/\n/)
      details[key] = value
    }
  }
  return details
}

function parseAdditionalDetails() {
  const text = document.getElementById('property-details-scroll').innerText
  let additionalDetails = {}
  let lines = text.split("\n")
  for (const line of lines) {
    if (line.includes(': ')) {
      const [key, value] = line.split(': ')
      additionalDetails[key] = value
    } else {
      additionalDetails[line] = true
    }
  }
  return additionalDetails
}


function calculateListDate(timeOnRedfinStr) {
  if (!timeOnRedfinStr) return

  const [value, unit] = timeOnRedfinStr.split(/ /)
  let dateListed = new Date()
  if (unit === 'day' || unit === 'days') {
    dateListed.setDate(dateListed.getDate() - value)
  }

  let month = dateListed.getMonth() + 1
  let date = dateListed.getDate()
  const year = dateListed.getFullYear()

  if (month < 10) month = "0" + month
  if (date < 10) date = "0" + date

  return [month, date, year].join('/')
}

// Use 'Log All Details' to view object in browser console
function getAllDetails() {
  const fullAddress = getStreetAddress() + ', ' + getCityStateZip()
  const mainStats = parseMainStats()
  const keyDetails = parseKeyDetailsList()
  const dateListed = calculateListDate(keyDetails['Time on Redfin'])
  const additionalDetails = parseAdditionalDetails()

  let basement = 'No'
  if (additionalDetails['Basement Information']) {
    basement = 'Yes (?)'
    if (basement = additionalDetails['Partial, Unfinished']) basement = 'Yes (Unfinished)'
    else if (basement = additionalDetails['Fully Finished']) basement = 'Yes (Finished)'
  }
  return {
    'URL': window.location.toString(),
    'Full Address': fullAddress,
    'Date Listed': dateListed,
    ...mainStats,
    ...keyDetails,
    ...additionalDetails,
    'Basement': basement,

    'Unknown': '?',
  }
}

function getDetailsAsString(keys, delimiter = "\t") {
  const allDetails = getAllDetails()
  let details = []
  for (const key of keys) {
    const defaultValue = key.includes('Has') ? 'No' : ''
    details.push(allDetails[key] || defaultValue)
  }
  return details.join(delimiter)
}

function getLongRow() {
  const keys = ['MLS#', 'Date Listed', 'URL', 'Full Address', 'Beds', 'Baths', 'Price', 'Sq Ft']
  return getDetailsAsString(keys)
}

function getShortRow() {
  const keys = ['MLS#', 'Full Address']
  return getDetailsAsString(keys)
}

function getScoringDetails() {
  const keys = [
    'Full Address',
    'Town',
    'URL',
    'Price',
    'Beds',
    'Baths',
    'Sq Ft',
    'Lot Size',
    'Year Built',
    'Tax Annual Amount',
    'Basement',
    'Has Garage',
    'Unknown', // walk-in closet
    'Unknown', // soak tub
    'Unknown', // patio
  ]
  return getDetailsAsString(keys, "\n")
}

function copy(str) {
  if (str) navigator.clipboard.writeText(str)
  else alert('Could not copy to clipboard')
}

window.onload = function () {
  if (!document.body.innerText.includes("you might be a robot")) {
    document.body.innerHTML += makeToolbox()
    document.getElementById('rtb-copy-long-row').onclick = function () { copy(getLongRow()) }
    document.getElementById('rtb-copy-short-row').onclick = function () { copy(getShortRow()) }
    document.getElementById('rtb-copy-scoring-details').onclick = function () { copy(getScoringDetails()) }
    document.getElementById('rtb-log-all-details').onclick = function () { console.log(getAllDetails()) }
  }
}
