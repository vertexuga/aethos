class EntityManager {
  constructor() {
    this.entities = [];
  }

  add(entity) {
    this.entities.push(entity);
    return entity;
  }

  remove(id) {
    const entity = this.entities.find(e => e.id === id);
    if (entity) {
      entity.active = false;
    }
  }

  update(dt) {
    // Update all active entities
    for (const entity of this.entities) {
      if (entity.active) {
        entity.update(dt);
      }
    }

    // Remove inactive entities after update loop (avoid mutation during iteration)
    this.entities = this.entities.filter(e => e.active);
  }

  render(ctx, interpolation) {
    for (const entity of this.entities) {
      if (entity.active) {
        entity.render(ctx, interpolation);
      }
    }
  }

  getByType(type) {
    return this.entities.filter(e => e.active && e.type === type);
  }

  getAll() {
    return this.entities.filter(e => e.active);
  }

  clear() {
    this.entities = [];
  }

  get count() {
    return this.entities.filter(e => e.active).length;
  }
}

export default EntityManager;
