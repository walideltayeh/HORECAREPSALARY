
import streamlit as st
import pandas as pd
from datetime import datetime

# Page config
st.set_page_config(page_title="Sales Dashboard", layout="wide")

# Title
st.title("Sales Performance Dashboard")

# Mock data (replace with your actual data fetching logic)
performance_data = {
    'largeVisits': 10,
    'mediumVisits': 15,
    'smallVisits': 20,
    'largeContracts': 5,
    'mediumContracts': 8,
    'smallContracts': 12,
    'baseSalary': 5000,
    'kpiBonus': 2000,
    'totalSalary': 7000
}

kpi_settings = {
    'targetLargeVisit': 15,
    'targetMediumVisit': 20,
    'targetSmallVisit': 25,
    'targetLargeContract': 10,
    'targetMediumContract': 12,
    'targetSmallContract': 15,
    'baseSalaryPercentage': 70,
    'totalTargetSalary': 8000
}

# Create three columns for KPIs
col1, col2, col3 = st.columns(3)

# Visit Progress
with col1:
    st.subheader("Visit Progress")
    total_visits = (
        performance_data['largeVisits'] + 
        performance_data['mediumVisits'] + 
        performance_data['smallVisits']
    )
    total_visit_targets = (
        kpi_settings['targetLargeVisit'] + 
        kpi_settings['targetMediumVisit'] + 
        kpi_settings['targetSmallVisit']
    )
    visit_percentage = round((total_visits / total_visit_targets) * 100)
    st.metric("Total Visits", total_visits, f"{visit_percentage}% of target")

# Contract Progress
with col2:
    st.subheader("Contract Progress")
    total_contracts = (
        performance_data['largeContracts'] + 
        performance_data['mediumContracts'] + 
        performance_data['smallContracts']
    )
    total_contract_targets = (
        kpi_settings['targetLargeContract'] + 
        kpi_settings['targetMediumContract'] + 
        kpi_settings['targetSmallContract']
    )
    contract_percentage = round((total_contracts / total_contract_targets) * 100)
    st.metric("Total Contracts", total_contracts, f"{contract_percentage}% of target")

# Salary Summary
with col3:
    st.subheader("Salary Summary")
    salary_percentage = round((performance_data['totalSalary'] / kpi_settings['totalTargetSalary']) * 100)
    st.metric("Total Salary", f"${performance_data['totalSalary']}", f"{salary_percentage}% of target")

# Detailed breakdowns
st.divider()

# Create two columns for detailed charts
col1, col2 = st.columns(2)

with col1:
    st.subheader("Visits by Cafe Size")
    visits_data = pd.DataFrame({
        'Size': ['Large', 'Medium', 'Small'],
        'Completed': [
            performance_data['largeVisits'],
            performance_data['mediumVisits'],
            performance_data['smallVisits']
        ],
        'Target': [
            kpi_settings['targetLargeVisit'],
            kpi_settings['targetMediumVisit'],
            kpi_settings['targetSmallVisit']
        ]
    })
    st.dataframe(visits_data, use_container_width=True)

with col2:
    st.subheader("Contracts by Cafe Size")
    contracts_data = pd.DataFrame({
        'Size': ['Large', 'Medium', 'Small'],
        'Completed': [
            performance_data['largeContracts'],
            performance_data['mediumContracts'],
            performance_data['smallContracts']
        ],
        'Target': [
            kpi_settings['targetLargeContract'],
            kpi_settings['targetMediumContract'],
            kpi_settings['targetSmallContract']
        ]
    })
    st.dataframe(contracts_data, use_container_width=True)
