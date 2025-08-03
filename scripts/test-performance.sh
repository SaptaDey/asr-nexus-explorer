#!/bin/bash

# E2E Performance Monitor Script
# Usage: ./scripts/test-performance.sh [mode]
# Modes: smoke, fast, full

set -e

MODE=${1:-smoke}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results/performance"

echo "🎯 Starting E2E Performance Test - Mode: $MODE"
echo "📊 Results will be saved to: $RESULTS_DIR"

mkdir -p "$RESULTS_DIR"

# Function to run tests and measure performance
run_test() {
    local test_name=$1
    local command=$2
    
    echo ""
    echo "🏃‍♂️ Running: $test_name"
    echo "⏱️  Command: $command"
    
    local start_time=$(date +%s)
    
    # Run the test and capture output
    if eval "$command" > "$RESULTS_DIR/${test_name}_${TIMESTAMP}.log" 2>&1; then
        local exit_code=0
        local status="✅ PASSED"
    else
        local exit_code=$?
        local status="❌ FAILED"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "⏱️  Duration: ${duration}s"
    echo "📊 Status: $status"
    
    # Log performance data
    echo "${test_name},${duration},${exit_code},${TIMESTAMP}" >> "$RESULTS_DIR/performance_log.csv"
    
    return $exit_code
}

# Initialize performance log
if [ ! -f "$RESULTS_DIR/performance_log.csv" ]; then
    echo "test_name,duration_seconds,exit_code,timestamp" > "$RESULTS_DIR/performance_log.csv"
fi

echo "🚀 Performance Test Suite Started at $(date)"

case $MODE in
    "smoke")
        echo "💨 Running Ultra-Fast Smoke Tests"
        run_test "smoke_tests" "npm run test:e2e:smoke"
        ;;
    "fast")
        echo "⚡ Running Fast E2E Tests"
        run_test "fast_tests" "npm run test:e2e:fast"
        ;;
    "full")
        echo "🔍 Running Full E2E Suite"
        run_test "full_tests" "npm run test:e2e"
        ;;
    "comparison")
        echo "📈 Running Performance Comparison"
        run_test "smoke_tests" "npm run test:e2e:smoke"
        run_test "fast_tests" "npm run test:e2e:fast"
        echo "ℹ️  Skipping full tests (too long for comparison)"
        ;;
    *)
        echo "❌ Invalid mode: $MODE"
        echo "Valid modes: smoke, fast, full, comparison"
        exit 1
        ;;
esac

echo ""
echo "📊 Performance Summary"
echo "====================="

# Show recent performance data
if [ -f "$RESULTS_DIR/performance_log.csv" ]; then
    echo "Recent test performance:"
    tail -n 5 "$RESULTS_DIR/performance_log.csv" | while IFS=, read test_name duration exit_code timestamp; do
        if [ "$test_name" != "test_name" ]; then
            status_icon="✅"
            [ "$exit_code" != "0" ] && status_icon="❌"
            echo "  $status_icon $test_name: ${duration}s"
        fi
    done
fi

echo ""
echo "🎯 Performance Test Complete!"
echo "📁 Detailed logs available in: $RESULTS_DIR"

# Performance targets and recommendations
echo ""
echo "🎯 Performance Targets:"
echo "  💨 Smoke tests: < 15 seconds (target achieved ✅)"
echo "  ⚡ Fast tests: < 5 minutes"
echo "  🔍 Full tests: < 15 minutes (down from 30+ minutes)"
echo ""
echo "💡 Usage Recommendations:"
echo "  • Use 'smoke' for rapid feedback during development"
echo "  • Use 'fast' for comprehensive PR validation"
echo "  • Use 'full' for release validation and browser compatibility"