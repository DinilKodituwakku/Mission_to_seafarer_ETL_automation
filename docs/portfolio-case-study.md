# Seafarer Visits Reporting Automation

## Project overview

Developed a reporting pipeline for the Mission to Seafarers to bring ship-in-port information and seafarer sign-in records together. The goal was to make it easier to review visits by ship and berth across daily, month-to-date and quarter-to-date periods.

## My approach

I used Playwright to automate collection from browser-based sources and Python to clean, match and aggregate the records. The pipeline keeps timestamped ship snapshots, filters selected berths and counts distinct names per ship for the selected reporting period. It generates an Excel report with separate views for ships, berths and totals, including historical tables.

The report uses an estimate of 22 crew per ship to calculate a visitor percentage. It flags missing coverage, because a snapshot can miss ships that arrive and depart between checks, and differences in ship names can prevent a match.

## Tools and skills

Python · JavaScript · Playwright · Jupyter Notebook · Excel reporting · Windows Task Scheduler · data cleaning and validation

## What I learned

This project highlighted the importance of treating missing data differently from zero, documenting assumptions, protecting sign-in information and designing automation that can report when it fails. It also showed the trade-off between running scheduled work on a laptop and moving it to an approved cloud environment.

*The public repository contains code and documentation only. Real seafarer records, credentials and operational reports are excluded.*
