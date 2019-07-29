import ReactDOM from "react-dom";
import React, { useState, Component } from "react";
import * as uuid from "uuid/v4";
import { ipcRenderer as ipc } from "electron";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronUp,
  faChevronDown,
  faCodeBranch,
  faTimes,
  faCheck,
  faTrashAlt,
  faPlus,
  faEdit
} from "@fortawesome/free-solid-svg-icons";

import "./styles.scss";

class App extends Component {
  constructor(props, state) {
    super(props, state);
    this.state = {
      tasks: [],
      timestamp: Date.now()
    };
  }

  componentDidMount() {
    ipc.on("got-tasks", (event, { success, tasks, error }) => {
      if (success) {
        this.setState({
          tasks,
          timestamp: Date.now()
        });
      } else {
        throw new Error(error);
      }
    });

    ipc.on("saved-task", (event, { success, error, isNew }) => {
      if (success) {
        if (isNew) {
          ipc.send("get-tasks");
        }
      } else {
        throw new Error(error);
      }
    });

    ipc.on("removed-task", (event, { success, error }) => {
      if (success) {
        ipc.send("get-tasks");
      } else {
        throw new Error(error);
      }
    });

    ipc.on("moved-task", (event, { success, error }) => {
      if (success) {
        ipc.send("get-tasks");
      } else {
        throw new Error(error);
      }
    });

    ipc.on("removed-todo", (event, { success, error }) => {
      if (success) {
        ipc.send("get-tasks");
      } else {
        throw new Error(error);
      }
    });

    ipc.on("saved-todo", (event, { success, error, isNew, todo }) => {
      if (success) {
        if (isNew) {
          ipc.send("get-tasks");
        }
      } else {
        throw new Error(error);
      }
    });

    ipc.on("moved-todo", (event, { success, error }) => {
      if (success) {
        ipc.send("get-tasks");
      } else {
        throw new Error(error);
      }
    });

    ipc.send("get-tasks");
  }

  componentWillUnmount() {
    ipc.removeAllListeners();
    clearInterval(this.updateInterval);
  }

  render() {
    return (
      <div>
        <div className="hero">
          <div className="text-container">
            <div className="profile-picture" />
            <h1>TASKS:</h1>
          </div>
        </div>
        <AddTask />
        <div className="tasks">
          {this.state.tasks.map((task, index) => (
            <Task task={task} key={task.name + task.id + index} />
          ))}
        </div>
      </div>
    );
  }
}

function AddTask() {
  const [showInput, toggleInput] = useState(false);
  const [taskName, setTaskName] = useState("");

  const cancel = () => {
    setTaskName("");
    toggleInput(false);
  };

  const addNewTask = () => {
    if (taskName) {
      ipc.send("save-task", {
        name: taskName,
        id: uuid(),
        todos: [{ id: uuid(), completed: false, description: "Review code" }]
      });
      cancel();
    }
  };

  const onKeyUp = event => {
    if (event.key === "Enter") {
      addNewTask();
    }
  };

  if (showInput) {
    return (
      <div className="add-new-task-container animated faster flipInX" key="1">
        <input
          id="add-new-task-input"
          type="text"
          className="outlined-primary"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          onKeyUp={onKeyUp}
          placeholder="Branch name..."
        />
        <button onClick={addNewTask} className="filled-primary grow-btn">
          <FontAwesomeIcon icon={faCheck} />
        </button>
        <button onClick={cancel} className="filled-primary grow-btn">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    );
  } else {
    return (
      <div className="add-new-task-container animated faster flipInX" key="2">
        <button
          id="add-new-task"
          className="outlined-primary grow-btn btn"
          onClick={() => {
            toggleInput(true);
            setTimeout(() => document.getElementById("add-new-task-input").focus(), 100);
          }}
        >
          ADD NEW TASK
        </button>
      </div>
    );
  }
}

function Task({ task }) {
  const [name, setName] = useState(task.name || "");
  const [isEditing, setEditing] = useState(false);

  const onNameChange = event => {
    setName(event.target.value);
  };

  const saveName = () => {
    task.name = name;
    setEditing(false);
    ipc.send("save-task", task);
  };

  const removeTask = () => {
    ipc.send("remove-task", taskId);
  };

  const moveUp = () => {
    ipc.send("move-task", { id: task.id, direction: "up" });
  };

  const moveDown = () => {
    ipc.send("move-task", { id: task.id, direction: "down" });
  };

  const taskId = task.id;

  return (
    <div className="task">
      <div className="task-title animated zoomIn faster">
        <FontAwesomeIcon icon={faCodeBranch} />
        {isEditing ? <input id={task.id + "_name"} onChange={onNameChange} value={name} /> : <h2>{task.name}</h2>}
        {isEditing ? (
          <button onClick={saveName} className="filled-primary task-button">
            <FontAwesomeIcon icon={faCheck} />
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="filled-primary task-button">
            <FontAwesomeIcon icon={faEdit} />
          </button>
        )}
        {isEditing && (
          <button
            className="filled-primary task-button"
            onClick={() => {
              setEditing(false);
              setName(task.name);
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
        {!isEditing && (
          <button onClick={moveUp} className="filled-primary task-button">
            <FontAwesomeIcon icon={faChevronUp} />
          </button>
        )}
        {!isEditing && (
          <button onClick={moveDown} className="filled-primary task-button">
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
        )}
        {!isEditing && (
          <button onClick={removeTask} className="filled-primary task-button">
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        )}
      </div>
      <div className="todos">
        {task.todos.map((todo, index) => {
          return <Todo taskId={task.id} todo={todo} key={todo.id + todo.todo + index} />;
        })}
        <AddTodo task={task} />
      </div>
    </div>
  );
}

function Todo({ taskId, todo }) {
  const id = todo.id;

  const [description, setDescription] = useState(todo.description || "");
  const [completed, setCompleted] = useState(todo.completed || false);

  const onChangeCompleted = event => {
    const checked = event.currentTarget.checked;
    todo.completed = checked;
    ipc.send("save-todo", { todo, taskId });
    setCompleted(todo.completed);
  };
  const onBlurDescription = event => {
    const text = event.currentTarget.value;
    todo.description = text;
    ipc.send("save-todo", { todo, taskId });
  };

  const onRemoveTodo = () => {
    ipc.send("remove-todo", { id, taskId });
  };

  const moveUp = () => {
    ipc.send("move-todo", { id, taskId, direction: "up" });
  };

  const moveDown = () => {
    ipc.send("move-todo", { id, taskId, direction: "down" });
  };

  const onChangeDescription = event => {
    setDescription(event.target.value);
  };

  return (
    <div className="todo animated zoomIn faster">
      <h3 className="todo-number" />
      <textarea
        className="todo-text"
        type="text"
        value={description}
        onChange={onChangeDescription}
        onBlur={onBlurDescription}
      />
      <input type="checkbox" value={completed} checked={completed} onChange={onChangeCompleted} />
      <button className="move-button button" onClick={moveDown}>
        <FontAwesomeIcon icon={faChevronDown} />
      </button>
      <button className="move-button button" onClick={moveUp}>
        <FontAwesomeIcon icon={faChevronUp} />
      </button>
      <button className="remove-button button" onClick={onRemoveTodo}>
        <FontAwesomeIcon icon={faTrashAlt} />
      </button>
    </div>
  );
}

function AddTodo({ task }) {
  const [description, setDescription] = useState("");

  const onChange = event => {
    setDescription(event.target.value);
  };

  const onButtonClick = () => {
    ipc.send("save-todo", { taskId: task.id, todo: { completed: false, id: uuid(), description } });
    setDescription("");
  };

  const onKeyUp = event => {
    if (event.key === "Enter") {
      onButtonClick();
    }
  };

  return (
    <div className="todo-add">
      <input type="text" id={task.id + "_add"} value={description} onChange={onChange} onKeyUp={onKeyUp} />
      <button onClick={onButtonClick}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
