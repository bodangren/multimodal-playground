# Plan: Serverless-Ready State Persistence

## Phase 1: SQLite Schema and Adapter (TDD)
- [ ] Write failing tests for SQLiteJobQueue adapter interface
- [ ] Create SQLite schema for jobs table
- [ ] Implement SQLiteJobQueue with enqueue, dequeue, complete, fail, retry methods
- [ ] Tests pass

## Phase 2: Circuit Breaker SQLite Migration (TDD)
- [ ] Write failing tests for SQLiteCircuitBreakerStore
- [ ] Create circuit_breakers table
- [ ] Replace JSON file persistence with SQLite store in CircuitBreaker
- [ ] Tests pass

## Phase 3: Integration and Fallback
- [ ] Wire SQLiteJobQueue into existing JobQueue interface
- [ ] Wire SQLiteCircuitBreakerStore with graceful fallback
- [ ] Run full test suite
- [ ] Build passes

## Phase 4: Verification and Documentation
- [ ] Verify state survives process restart
- [ ] Update tech-debt.md
- [ ] Update lessons-learned.md
- [ ] Commit and push
