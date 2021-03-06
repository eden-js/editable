/* eslint-disable no-empty */

// require dependencies
const socket     = require('socket');
const Controller = require('controller');

// require models
const Block     = model('block');
const Placement = model('editablePlacement');

// require helpers
const syncHelper  = helper('sync');
const blockHelper = helper('cms/block');

/**
 * build placement controller
 *
 * @mount /editable/placement
 */
class EditableController extends Controller {
  /**
   * construct user EditableController controller
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.viewAction = this.viewAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
  }

  /**
   * socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.listen.placement
   * @return {Async}
   */
  async listenAction(id, uuid, opts) {
    // / return if no id
    if (!id) return null;

    // join room
    opts.socket.join(`placement.${id}`);

    // add to room
    return await syncHelper.addListener(await Placement.findById(id), {
      user      : opts.user,
      atomic    : true,
      listenID  : uuid,
      sessionID : opts.sessionID,
    });
  }

  /**
   * socket listen action
   *
   * @param  {String} id
   * @param  {Object} opts
   *
   * @call   model.deafen.placement
   * @return {Async}
   */
  async deafenAction(id, uuid, opts) {
    // / return if no id
    if (!id) return null;

    // join room
    opts.socket.leave(`placement.${id}`);

    // add to room
    return await syncHelper.removeListener(await Placement.findById(id), {
      user      : opts.user,
      atomic    : true,
      listenID  : uuid,
      sessionID : opts.sessionID,
    });
  }

  /**
   * add/edit action
   *
   * @route    {get} /:id/view
   * @route    {get} /:position/position
   * @layout   admin
   * @priority 12
   */
  async viewAction(req, res) {
    // set website variable
    let placement = new Placement();

    // check for website model
    if (req.params.id) {
      // load by id
      placement = await Placement.findById(req.params.id);
    }

    // check for website model
    if (req.params.position) {
      // load by id
      placement = await Placement.findOne({
        position : req.params.position,
      });
    }

    // check placement
    if (!placement) {
      // fail state
      return res.json({
        state : 'fail',
      });
    }

    // return JSON
    return res.json({
      state   : 'success',
      result  : await placement.sanitise(req),
      message : 'Successfully got blocks',
    });
  }

  /**
   * save block action
   *
   * @route    {post} /:id/block/save
   * @layout   admin
   * @priority 12
   */
  async saveBlockAction(req, res) {
    // set website variable
    let placement = new Placement({
      position : req.body.position,
    });

    // run try/catch
    try {
      // check for website model
      if (req.params.id && req.params.id !== 'undefined' && req.params.id !== 'null') {
        // load by id
        const chk = await Placement.findById(req.params.id);

        // set placement
        if (chk) {
          placement = chk;
        }
      }
    } catch (e) { }

    // get block
    const blocks  = placement.get('blocks') || [];
    const current = blocks.find(block => block.uuid === req.body.block.uuid);

    // check current
    if (!current) {
      // return json
      return res.json({
        state   : 'fail',
        result  : {},
        message : 'Block not found',
      });
    }

    // update
    const registered = blockHelper.blocks().find(w => w.type === current.type) || blockHelper.blocks().find(w => w.type === 'frontend.content');

    // await save
    if (registered) await registered.save(req, req.body.block);

    // get rendered
    const rendered = await registered.render(req, req.body.block);

    // set uuid
    rendered.uuid = req.body.block.uuid;

    // emit
    socket.room(`placement.${placement.get('_id').toString()}`, `placement.${placement.get('_id').toString()}.block`, rendered);

    // return JSON
    return res.json({
      state   : 'success',
      result  : rendered,
      message : 'Successfully saved block',
    });
  }

  /**
   * remove block action
   *
   * @route    {post} /:id/block/remove
   * @layout   admin
   * @priority 12
   */
  async removeBlockAction(req, res) {
    // get notes block from db
    const blockModel = await Block.findOne({
      uuid : req.body.block.uuid,
    }) || new Block({
      uuid : req.body.block.uuid,
      type : req.body.block.type,
    });

    // remove block
    if (blockModel.get('_id')) await blockModel.remove(req.user);

    // return JSON
    res.json({
      state   : 'success',
      result  : null,
      message : 'Successfully removed block',
    });
  }

  /**
   * create submit action
   *
   * @route  {post} /create
   * @layout admin
   */
  createAction(...args) {
    // return update action
    return this.updateAction(...args);
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route {post} /:id/update
   */
  async updateAction(req, res) {
    // set website variable
    let create = true;
    let placement = new Placement();

    // check for website model
    if (req.params.id) {
      // check
      const chk = await Placement.findById(req.params.id);

      // check
      if (chk) {
        // load by id
        create = false;

        // set placement
        placement = chk;
      }
    }

    // update placement
    placement.set('add', req.body.add);
    placement.set('name', req.body.name);
    placement.set('blocks', req.body.blocks);
    placement.set('position', req.body.position);

    // save placement
    await placement.save(req.user);

    // send alert
    req.alert('success', `Successfully ${create ? 'Created' : 'Updated'} placement!`);

    // return JSON
    res.json({
      state   : 'success',
      result  : await placement.sanitise(req),
      message : 'Successfully updated placement',
    });
  }
}

/**
 * export placement controller
 *
 * @type {EditableController}
 */
module.exports = EditableController;
