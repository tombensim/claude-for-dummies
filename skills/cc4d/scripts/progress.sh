#!/bin/bash
# CC4D Progress Tracker
# Manages step state and emits current step instructions
#
# Usage:
#   bash scripts/progress.sh next          # Show current step instructions
#   bash scripts/progress.sh complete N    # Mark step N complete, show next
#   bash scripts/progress.sh status        # Show progress summary
#   bash scripts/progress.sh reset         # Reset all progress

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
STEPS_DIR="$SKILL_DIR/steps"
STATE_FILE=".cc4d-progress.json"

# Initialize state file if missing
init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    cat > "$STATE_FILE" << 'INIT'
{
  "current_step": 1,
  "completed": [],
  "phase": 0
}
INIT
  fi
}

# Read current step from state
get_current_step() {
  python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d['current_step'])"
}

# Get phase for a step number
get_phase() {
  local step=$1
  if [ "$step" -le 2 ]; then echo 0
  elif [ "$step" -le 4 ]; then echo 1
  elif [ "$step" -le 6 ]; then echo 2
  elif [ "$step" -le 9 ]; then echo 3
  else echo 3
  fi
}

# Get phase name
get_phase_name() {
  case $1 in
    0) echo "Setup" ;;
    1) echo "Build" ;;
    2) echo "Iterate" ;;
    3) echo "Shipping" ;;
  esac
}

# Mark step complete and advance
complete_step() {
  local step=$1
  local next=$((step + 1))
  local phase=$(get_phase $next)

  python3 -c "
import json
d = json.load(open('$STATE_FILE'))
if $step not in d['completed']:
    d['completed'].append($step)
d['current_step'] = $next
d['phase'] = $phase
json.dump(d, open('$STATE_FILE', 'w'), indent=2)
"
}

# Show current step
show_next() {
  local step=$(get_current_step)
  local phase=$(get_phase $step)
  local phase_name=$(get_phase_name $phase)

  # Pad step number
  local step_padded=$(printf "%02d" $step)
  local step_file="$STEPS_DIR/${step_padded}-"*.md

  # Check if step file exists
  if ! ls $step_file 1>/dev/null 2>&1; then
    echo "=== CC4D: PROGRESS ==="
    echo "STATUS: complete"
    echo "MESSAGE: All steps finished!"
    echo "=== END ==="
    return
  fi

  local step_filename=$(basename $step_file)

  echo "=== CC4D: PROGRESS ==="
  echo "CURRENT_STEP: $step"
  echo "PHASE: $phase - $phase_name"
  echo "STEP_FILE: steps/$step_filename"
  echo "=== INSTRUCTIONS ==="
  cat $step_file
  echo ""
  echo "=== END ==="
}

# Show status summary
show_status() {
  local step=$(get_current_step)
  local phase=$(get_phase $step)
  local phase_name=$(get_phase_name $phase)

  echo "=== CC4D: STATUS ==="
  echo "CURRENT_STEP: $step of 9"
  echo "PHASE: $phase - $phase_name"
  echo "COMPLETED: $(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(','.join(map(str,d['completed'])) if d['completed'] else 'none')")"
  echo "=== END ==="
}

# Reset progress
reset_progress() {
  rm -f "$STATE_FILE"
  init_state
  echo "=== CC4D: PROGRESS ==="
  echo "STATUS: reset"
  echo "CURRENT_STEP: 1"
  echo "=== END ==="
}

# Main
init_state

case "${1:-next}" in
  next)
    show_next
    ;;
  complete)
    if [ -z "$2" ]; then
      echo "Usage: progress.sh complete <step_number>"
      exit 1
    fi
    complete_step "$2"
    show_next
    ;;
  status)
    show_status
    ;;
  reset)
    reset_progress
    ;;
  *)
    echo "Usage: progress.sh {next|complete N|status|reset}"
    exit 1
    ;;
esac
